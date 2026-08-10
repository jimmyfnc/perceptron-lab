"""
Generate the Feedback Bench loop-player transcripts: one real task given to
a local LLM three ways — one-shot prompt, critique-and-revise loop, and an
agent that can run the acceptance tests. Real transcripts, no fabrication;
curate by re-rolling --seed until the runs are honest AND legible.

Requires Ollama serving qwen3.6:27b (any python3 runs the harness):

    python scripts/generate_feedback_transcripts.py [--seed 1145]

Writes public/data/feedback.json:
  { model, task: {name, spec, tests: [label]},
    rungs: [{ id, title, tokens, steps: [{kind, text, code?, results?}] }] }
where results is a per-test boolean vector for every step that carries code.
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

OLLAMA = "http://localhost:11434/api/chat"
MODEL = "qwen3.6:27b"
TEMPERATURE = 0.7

SYSTEM = (
    "You are a Python engineer working on a utilities library. "
    "When asked for code, produce a complete, runnable function."
)

# Deliberately terse — the spec's silences (bare numbers, decimals, garbage
# input) ARE the lesson: loops surface hidden requirements.
SPEC = (
    "Write a Python function `parse_duration(s: str) -> int` that converts a "
    "human-readable duration string like '1h 30m' into the total number of "
    "seconds. Supported unit suffixes are h, m, and s. Return an int."
)

TESTS = [
    ("basic", "parse_duration('1h 30m')", "5400"),
    ("single unit", "parse_duration('2h')", "7200"),
    ("all units", "parse_duration('1h 30m 15s')", "5415"),
    ("bare number", "parse_duration('45')", "45"),
    ("decimal", "parse_duration('1.5h')", "5400"),
    ("invalid input", "parse_duration('abc')", "raises ValueError"),
]

HARNESS = """
import json
@@CODE@@

results = []

def check(fn, expected):
    try:
        got = fn()
        results.append({"pass": got == expected, "got": repr(got)})
    except Exception as e:
        results.append({"pass": False, "got": type(e).__name__ + ": " + str(e)})

def check_raises(fn, exc):
    try:
        got = fn()
        results.append({"pass": False, "got": "no exception, returned " + repr(got)})
    except Exception as e:
        results.append({"pass": isinstance(e, exc), "got": type(e).__name__})

check(lambda: parse_duration('1h 30m'), 5400)
check(lambda: parse_duration('2h'), 7200)
check(lambda: parse_duration('1h 30m 15s'), 5415)
check(lambda: parse_duration('45'), 45)
check(lambda: parse_duration('1.5h'), 5400)
check_raises(lambda: parse_duration('abc'), ValueError)
print(json.dumps(results))
"""


def run_tests(code: str) -> list[dict]:
    """Run the acceptance suite against candidate code in a subprocess."""
    src = HARNESS.replace("@@CODE@@", code)
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(src)
        path = f.name
    try:
        proc = subprocess.run(
            [sys.executable, path], capture_output=True, text=True, timeout=10
        )
        if proc.returncode != 0:
            err = (proc.stderr or "crashed").strip().splitlines()[-1][:200]
            return [{"pass": False, "got": err} for _ in TESTS]
        return json.loads(proc.stdout.strip().splitlines()[-1])
    except subprocess.TimeoutExpired:
        return [{"pass": False, "got": "timeout"} for _ in TESTS]
    finally:
        Path(path).unlink(missing_ok=True)


def chat(messages: list[dict], seed: int) -> tuple[str, int]:
    """One non-streaming Ollama completion → (content, eval tokens)."""
    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
        "think": False,
        "options": {"temperature": TEMPERATURE, "seed": seed, "num_ctx": 8192, "num_predict": 2048},
    }
    body = json.dumps(payload).encode()
    for attempt in (1, 2):
        try:
            req = urllib.request.Request(OLLAMA, body, {"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=900) as r:
                data = json.loads(r.read())
            content = data["message"]["content"]
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.S).strip()
            return content, int(data.get("eval_count", 0))
        except urllib.error.HTTPError as e:
            # older servers/models reject the top-level think flag — retry without
            if attempt == 1 and "think" in payload:
                del payload["think"]
                body = json.dumps(payload).encode()
                continue
            raise RuntimeError(f"ollama: {e.read().decode()[:300]}") from e
    raise RuntimeError("unreachable")


def extract_code(text: str) -> str | None:
    blocks = re.findall(r"```(?:python)?\n(.*?)```", text, flags=re.S)
    for b in reversed(blocks):
        if "def parse_duration" in b:
            return b.strip()
    return blocks[-1].strip() if blocks else None


def extract_json(text: str) -> dict | None:
    for candidate in (text, *re.findall(r"```(?:json)?\n(.*?)```", text, flags=re.S)):
        candidate = candidate.strip()
        start, end = candidate.find("{"), candidate.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(candidate[start : end + 1])
            except json.JSONDecodeError:
                continue
    return None


def scored_step(kind: str, text: str, code: str | None) -> dict:
    step = {"kind": kind, "text": text[:4000]}
    if code:
        step["code"] = code
        step["results"] = [bool(r["pass"]) for r in run_tests(code)]
    return step


def rung_oneshot(seed: int) -> dict:
    ask = SPEC + "\n\nReply with the complete function in a single python code block."
    text, toks = chat([{"role": "system", "content": SYSTEM}, {"role": "user", "content": ask}], seed)
    return {
        "id": "oneshot",
        "title": "one-shot prompt",
        "tokens": toks,
        "steps": [
            {"kind": "prompt", "text": ask},
            scored_step("assistant", text, extract_code(text)),
        ],
    }


CRITIQUE = (
    "Do not assume your answer is correct. Re-read the spec:\n\n{spec}\n\n"
    "List concrete inputs a caller might pass where your current "
    "implementation's behavior is undefined, surprising, or wrong given what "
    "the spec leaves unsaid. Then decide the most reasonable behavior for "
    "each and reply with the full revised function in one python code block."
)


def rung_loop(seed: int, rounds: int = 2) -> dict:
    ask = SPEC + "\n\nReply with the complete function in a single python code block."
    messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": ask}]
    steps = [{"kind": "prompt", "text": ask}]
    total = 0
    # round 1 reuses the one-shot seed on purpose: the loop starts from the
    # SAME draft, so everything it gains is visibly the loop's doing
    text, toks = chat(messages, seed)
    total += toks
    steps.append(scored_step("assistant", text, extract_code(text)))
    messages.append({"role": "assistant", "content": text})
    for r in range(rounds):
        critique = CRITIQUE.format(spec=SPEC)
        steps.append({"kind": "feedback", "text": critique})
        messages.append({"role": "user", "content": critique})
        text, toks = chat(messages, seed + r + 1)
        total += toks
        steps.append(scored_step("assistant", text, extract_code(text)))
        messages.append({"role": "assistant", "content": text})
    return {"id": "loop", "title": "critique-and-revise loop", "tokens": total, "steps": steps}


AGENT_SYSTEM = (
    SYSTEM
    + "\n\nYou are working autonomously. You have one tool: a test runner that "
    "executes the project's acceptance tests against your code. Reply with "
    "EXACTLY one JSON object and nothing else, in one of these two forms:\n"
    '  {"action": "run_tests", "code": "<full python source>"}\n'
    '  {"action": "submit", "code": "<full python source>"}\n'
    "Use run_tests to check your work; submit when you are confident. "
    "You decide when you are done."
)


def rung_agent(seed: int, max_steps: int = 6) -> dict:
    ask = SPEC
    messages = [{"role": "system", "content": AGENT_SYSTEM}, {"role": "user", "content": ask}]
    steps = [{"kind": "prompt", "text": ask}]
    total = 0
    for i in range(max_steps):
        text, toks = chat(messages, seed + i)
        total += toks
        messages.append({"role": "assistant", "content": text})
        action = extract_json(text)
        if not action or "code" not in action:
            note = "Your reply was not a valid tool call. Reply with exactly one JSON object."
            steps.append({"kind": "assistant", "text": text[:4000]})
            steps.append({"kind": "feedback", "text": note})
            messages.append({"role": "user", "content": note})
            continue
        code = action["code"]
        results = run_tests(code)
        vec = [bool(r["pass"]) for r in results]
        steps.append(
            {
                "kind": "agent-" + str(action.get("action", "?")),
                "text": text[:4000],
                "code": code,
                "results": vec,
            }
        )
        if action.get("action") == "submit":
            break
        failures = [
            {"test": TESTS[j][0], "call": TESTS[j][1], "expected": TESTS[j][2], "got": r["got"]}
            for j, r in enumerate(results)
            if not r["pass"]
        ]
        report = json.dumps({"passed": sum(vec), "total": len(vec), "failures": failures})
        steps.append({"kind": "tool", "text": report})
        messages.append({"role": "user", "content": report})
    return {"id": "agent", "title": "agent with a test tool", "tokens": total, "steps": steps}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=1145)
    ap.add_argument("--out", default="public/data/feedback.json")
    args = ap.parse_args()

    rungs = []
    for name, fn in [("oneshot", rung_oneshot), ("loop", rung_loop), ("agent", rung_agent)]:
        print(f"running rung: {name} ...", flush=True)
        r = fn(args.seed)
        scored = [s for s in r["steps"] if "results" in s]
        best = max((sum(s["results"]) for s in scored), default=0)
        print(f"  {len(r['steps'])} steps, {r['tokens']} tokens, best {best}/6", flush=True)
        rungs.append(r)

    out = Path(__file__).resolve().parents[1] / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "model": f"{MODEL} (4-bit quant, ollama, seed {args.seed})",
        "task": {
            "name": "parse_duration",
            "spec": SPEC,
            "tests": [f"{call} == {exp}" if "raise" not in exp else f"{call} {exp}" for _, call, exp in TESTS],
            "labels": [t[0] for t in TESTS],
        },
        "rungs": rungs,
    }
    out.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
