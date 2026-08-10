"""
Extract real GPT-2 next-token logits for the Token Sampler (Feedback Bench).

Run with any Python that has torch + transformers (the ComfyUI venv works):

    D:/GitHub/ComfyUI/venv/Scripts/python.exe scripts/extract_logits.py

Writes public/data/logits.json:
  { model, prompts: [{ id, text, tokens, logits }] }
where tokens/logits are the top-200 next-token candidates by logit, so
temperature / top-k / top-p can be computed live in the browser.
"""

import json
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL = "gpt2"
TOP = 200

# Curated to span the entropy range: near-deterministic → wide open.
PROMPTS = [
    ("paris", "The capital of France is"),
    ("arithmetic", "Two plus two equals"),
    ("fairytale", "Once upon a time, there was a"),
    ("door", "The scientist opened the door and saw"),
    ("ml", "The best thing about machine learning is"),
]


def main() -> None:
    out_path = Path(__file__).resolve().parents[1] / "public" / "data" / "logits.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForCausalLM.from_pretrained(MODEL)
    model.eval()

    prompts = []
    for pid, text in PROMPTS:
        enc = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            logits = model(**enc).logits[0, -1]
        top = torch.topk(logits, TOP)
        # decode per-token so spacing survives ("Ġthe" → " the")
        tokens = [tokenizer.decode([i]) for i in top.indices.tolist()]
        prompts.append(
            {
                "id": pid,
                "text": text,
                "tokens": tokens,
                "logits": [round(v, 3) for v in top.values.tolist()],
            }
        )
        print(f"{pid}: top token {tokens[0]!r}")

    data = {"model": MODEL, "prompts": prompts}
    out_path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
