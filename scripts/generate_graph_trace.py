"""
Generate the Wiring Loom's signature data: the same six machine-checkable
mini-tasks run through two real orgs on a local model —

  generalist : one prompt solves everything, straight through
  routed     : a router node classifies each task (one word), then hands it
               to one of three specialist prompts (regex / math / extract)

Requires Ollama serving qwen3.6:27b:

    python scripts/generate_graph_trace.py [--seed 2145]

Writes public/data/graphtrace.json. Scoring is strict and identical for
both orgs (downstream consumers are parsers, not readers). Honest results
only — a misroute or a generalist win ships as-is.
"""

import argparse
import json
import re
import urllib.request
from pathlib import Path

OLLAMA = "http://localhost:11434/api/chat"
MODEL = "qwen3.6:27b"

# ---- the six tasks -------------------------------------------------------

IPV4_POS = ["0.0.0.0", "255.255.255.255", "192.168.0.1", "10.255.3.99"]
IPV4_NEG = ["256.1.1.1", "192.168.01.1", "1.2.3", "1.2.3.4.5", "999.1.1.1", "1..2.3"]
HEX_POS = ["#abc", "#A1B2C3", "#09f", "#FFFFFF"]
HEX_NEG = ["abc", "#ab", "#abcd", "#a1b2c3d4", "#ggg", "# abc"]

TASKS = [
    {
        "id": "ipv4-regex",
        "kind": "regex",
        "prompt": (
            "Write a regular expression that matches an IPv4 address: four "
            "numbers 0-255 separated by dots, no leading zeros (so '192.168.0.1' "
            "matches but '192.168.01.1' and '256.1.1.1' do not). Give the pattern."
        ),
        "check": "fullmatch on 4 valid addresses, reject 6 invalid",
    },
    {
        "id": "hex-regex",
        "kind": "regex",
        "prompt": (
            "Write a regular expression that matches CSS hex colors: '#' followed "
            "by exactly 3 or exactly 6 hex digits, like '#a3f' or '#A1B2C3'. "
            "Give the pattern."
        ),
        "check": "fullmatch on 4 valid colors, reject 6 invalid",
    },
    {
        "id": "gpu-farm",
        "kind": "math",
        "prompt": (
            "A render farm has 4 racks of 6 GPUs. A third of its GPUs are busy "
            "on a job that keeps running. You install 2 more racks, but 5 of the "
            "newly delivered GPUs are dead on arrival. How many working GPUs are "
            "idle now?"
        ),
        "check": "final integer equals 23",
        "answer": 23,
    },
    {
        "id": "tickets",
        "kind": "math",
        "prompt": (
            "Tickets cost $12 each. You buy 7, a 25% group discount applies to "
            "the tickets only, and there is a $3 booking fee per order. You pay "
            "with a $50 bill and a $20 bill. How many dollars of change do you "
            "get?"
        ),
        "check": "final integer equals 4",
        "answer": 4,
    },
    {
        "id": "meeting",
        "kind": "extract",
        "prompt": (
            "From this note, extract the person's name and the currently valid "
            'date as JSON with keys "name" and "date" (date in ISO YYYY-MM-DD): '
            "\"Heads up - Dana's review, originally 9/3, got moved to the 14th "
            'of September 2026, room 4B."'
        ),
        "check": 'JSON equals {"name": "Dana", "date": "2026-09-14"}',
        "answer": {"name": "Dana", "date": "2026-09-14"},
    },
    {
        "id": "invoice",
        "kind": "extract",
        "prompt": (
            "From this note, extract the company name and the currently valid "
            'date as JSON with keys "name" and "date" (date in ISO YYYY-MM-DD): '
            '"Fwd: URGENT - Okafor Ltd invoice #778 (was due 11/30, extended two '
            'weeks to 12/14/2026)."'
        ),
        "check": 'JSON equals {"name": "Okafor Ltd", "date": "2026-12-14"}',
        "answer": {"name": "Okafor Ltd", "date": "2026-12-14"},
    },
]

# ---- the org's prompts ---------------------------------------------------

GENERALIST = "You are a helpful assistant. Solve the user's task."

ROUTER = (
    "You are a router node in an agent graph. Classify the task into exactly "
    "one of these lanes: regex, math, extract. Reply with that single word "
    "and nothing else."
)

SPECIALISTS = {
    "regex": (
        "You are a regex specialist node. Think about anchors, character "
        "classes, and boundary values (ranges like 00-23 need alternation, "
        "not [0-2][0-9]). Test your pattern mentally against edge cases "
        "before answering. Reply with ONLY the final pattern inside one "
        "code fence, no flags, no prose."
    ),
    "math": (
        "You are an arithmetic specialist node. Work step by step, track "
        "every quantity change in order, then end your reply with the final "
        "number alone on the last line."
    ),
    "extract": (
        "You are an extraction specialist node. Reply with ONLY a JSON "
        "object, no prose, no code fence. Normalize dates to ISO "
        "YYYY-MM-DD. Copy names exactly as written. When a value was "
        "changed, rescheduled, or superseded, extract the one currently "
        "in force."
    ),
}

# ---- scoring (identical for both orgs) -----------------------------------


def regex_candidates(text: str) -> list[str]:
    cands = re.findall(r"```(?:\w+)?\n?(.*?)```", text, flags=re.S)
    cands += [ln for ln in text.splitlines() if ln.strip()]
    cands.append(text)
    out = []
    for c in cands:
        c = c.strip().strip("`").strip()
        for quote in ("'", '"'):
            if c.startswith(quote) and c.endswith(quote) and len(c) > 1:
                c = c[1:-1]
        if c.startswith("r'") or c.startswith('r"'):
            c = c[2:-1]
        if c:
            out.append(c)
    return out


def score_regex(text: str, pos: list[str], neg: list[str]) -> tuple[bool, str]:
    for cand in regex_candidates(text):
        try:
            rx = re.compile(cand)
        except re.error:
            continue
        if all(rx.fullmatch(s) for s in pos) and not any(rx.fullmatch(s) for s in neg):
            return True, cand
    return False, regex_candidates(text)[0] if regex_candidates(text) else ""


def score_math(text: str, answer: int) -> tuple[bool, str]:
    nums = re.findall(r"-?\d+", text.replace(",", ""))
    got = nums[-1] if nums else "(no number)"
    return (bool(nums) and int(got) == answer), got


def score_extract(text: str, answer: dict) -> tuple[bool, str]:
    for m in re.finditer(r"\{[^{}]*\}", text, flags=re.S):
        try:
            got = json.loads(m.group(0))
        except json.JSONDecodeError:
            continue
        if got == answer:
            return True, m.group(0)
    m = re.search(r"\{[^{}]*\}", text, flags=re.S)
    return False, (m.group(0) if m else "(no json)")


def score(task: dict, text: str) -> tuple[bool, str]:
    if task["kind"] == "regex":
        pos, neg = (IPV4_POS, IPV4_NEG) if task["id"] == "ipv4-regex" else (HEX_POS, HEX_NEG)
        return score_regex(text, pos, neg)
    if task["kind"] == "math":
        return score_math(text, task["answer"])
    return score_extract(text, task["answer"])


# ---- ollama --------------------------------------------------------------


def chat(system: str, user: str, seed: int, num_predict: int = 1024) -> tuple[str, int]:
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "think": False,
        "options": {"temperature": 0.7, "seed": seed, "num_predict": num_predict},
    }
    req = urllib.request.Request(
        OLLAMA, json.dumps(payload).encode(), {"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=900) as r:
        data = json.loads(r.read())
    content = re.sub(r"<think>.*?</think>", "", data["message"]["content"], flags=re.S).strip()
    return content, int(data.get("eval_count", 0))


# ---- the two orgs --------------------------------------------------------


def run_generalist(seed: int) -> dict:
    runs = []
    for i, task in enumerate(TASKS):
        text, toks = chat(GENERALIST, task["prompt"], seed + i)
        ok, shown = score(task, text)
        runs.append(
            {
                "task": task["id"],
                "steps": [{"node": "generalist", "text": text[:3000], "tokens": toks}],
                "pass": ok,
                "shown": shown[:200],
            }
        )
        print(f"  generalist {task['id']}: {'PASS' if ok else 'fail'} ({toks} tok)", flush=True)
    return {"id": "generalist", "title": "the generalist", "runs": runs}


def run_routed(seed: int) -> dict:
    runs = []
    for i, task in enumerate(TASKS):
        decision_raw, rtoks = chat(ROUTER, task["prompt"], seed + 50 + i, num_predict=10)
        decision = decision_raw.strip().lower().split()[0].strip(".,:") if decision_raw else "?"
        lane = decision if decision in SPECIALISTS else "extract"
        text, stoks = chat(SPECIALISTS[lane], task["prompt"], seed + 100 + i)
        ok, shown = score(task, text)
        runs.append(
            {
                "task": task["id"],
                "steps": [
                    {"node": "router", "text": decision_raw[:200], "tokens": rtoks, "decision": lane},
                    {"node": f"{lane}-specialist", "text": text[:3000], "tokens": stoks},
                ],
                "pass": ok,
                "shown": shown[:200],
                "misroute": lane != task["kind"],
            }
        )
        flag = " MISROUTE" if lane != task["kind"] else ""
        print(
            f"  routed {task['id']}: -> {lane}{flag}, {'PASS' if ok else 'fail'} "
            f"({rtoks}+{stoks} tok)",
            flush=True,
        )
    return {"id": "routed", "title": "router + specialists", "runs": runs}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=2145)
    args = ap.parse_args()

    print("org: generalist ...", flush=True)
    generalist = run_generalist(args.seed)
    print("org: routed ...", flush=True)
    routed = run_routed(args.seed)

    def totals(org: dict) -> dict:
        return {
            "passed": sum(r["pass"] for r in org["runs"]),
            "tokens": sum(s["tokens"] for r in org["runs"] for s in r["steps"]),
        }

    data = {
        "model": f"{MODEL} (4-bit quant, ollama, seed {args.seed}, temp 0.7)",
        "tasks": [
            {"id": t["id"], "kind": t["kind"], "prompt": t["prompt"], "check": t["check"]}
            for t in TASKS
        ],
        "orgs": [generalist, routed],
        "totals": {"generalist": totals(generalist), "routed": totals(routed)},
    }
    out = Path(__file__).resolve().parents[1] / "public" / "data" / "graphtrace.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"totals: {data['totals']}")
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
