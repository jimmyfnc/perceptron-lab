"""
Generate the Prompt Anatomy Grid data: one fixed task run through all 16
combinations of role / context / constraints / example toggles, against the
same local model with the same seed — every output delta is the prompt's.

Requires Ollama serving qwen3.6:27b:

    python scripts/generate_prompt_anatomy.py [--seed 7]

Writes public/data/prompt-anatomy.json:
  { model, base, components: {role, context, constraints, example},
    cells: {"0000".."1111": text} }   (bit order: role,context,constraints,example)
"""

import argparse
import itertools
import json
import re
import urllib.request
from pathlib import Path

OLLAMA = "http://localhost:11434/api/chat"
MODEL = "qwen3.6:27b"

BASE = "Explain what gradient descent is."

ROLE = "You are a patient teacher who explains ideas to curious ten-year-olds."
CONTEXT = "The reader is a kid who loves skateboarding and has never seen an equation."
CONSTRAINTS = "Answer in exactly two sentences. No math symbols, no jargon."
EXAMPLE = (
    "Match the style of this example.\n"
    'Q: "What is a neural network?"\n'
    'A: "It\'s like a huge team of tiny guessers that each notice one little '
    "thing, and when the team guesses wrong, every guesser adjusts a bit until "
    'the whole team gets good."'
)


def chat(system: str, user: str, seed: int) -> str:
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "think": False,
        "options": {"temperature": 0.7, "seed": seed, "num_predict": 400},
    }
    req = urllib.request.Request(
        OLLAMA, json.dumps(payload).encode(), {"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=600) as r:
        content = json.loads(r.read())["message"]["content"]
    return re.sub(r"<think>.*?</think>", "", content, flags=re.S).strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    cells = {}
    for bits in itertools.product((0, 1), repeat=4):
        role, context, constraints, example = bits
        system = ROLE if role else "You are a helpful assistant."
        user_parts = []
        if context:
            user_parts.append(CONTEXT)
        user_parts.append(BASE)
        if constraints:
            user_parts.append(CONSTRAINTS)
        if example:
            user_parts.append(EXAMPLE)
        key = "".join(map(str, bits))
        text = chat(system, "\n\n".join(user_parts), args.seed)
        cells[key] = text[:1500]
        print(f"{key}: {len(text)} chars", flush=True)

    out = Path(__file__).resolve().parents[1] / "public" / "data" / "prompt-anatomy.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "model": f"{MODEL} (seed {args.seed}, temp 0.7)",
        "base": BASE,
        "components": {
            "role": ROLE,
            "context": CONTEXT,
            "constraints": CONSTRAINTS,
            "example": EXAMPLE,
        },
        "cells": cells,
    }
    out.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
