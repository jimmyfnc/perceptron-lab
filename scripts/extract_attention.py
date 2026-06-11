"""
One-off extraction of real GPT-2 attention weights for the Transformers module.

Run with any Python that has torch + transformers (the ComfyUI venv works):

    D:/GitHub/ComfyUI/venv/Scripts/python.exe scripts/extract_attention.py

Writes public/data/attention.json:
  {
    model, layers, heads,
    sentences: [{ id, label, text, tokens, starts, attn }]
  }
where attn[layer][head] is a lower-triangular matrix (row i has i+1 weights,
since GPT-2 is causal and the upper triangle is exactly zero), rounded to 3dp.
"""

import json
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL = "gpt2"

# Curated for interesting attention: coreference, induction, agreement,
# positional rhythm, and one sentence pointing at the next station.
SENTENCES = [
    (
        "trophy",
        "the ambiguous pronoun",
        "The trophy didn't fit in the suitcase because it was too big.",
    ),
    (
        "keys",
        "long-range agreement",
        "The keys to the old wooden cabinet were lost.",
    ),
    (
        "mary",
        "two people, two pronouns",
        "When Mary handed the keys to John, he thanked her.",
    ),
    (
        "wizard",
        "a repeated phrase",
        "The wizard waved his wand, and the wizard cast a spell.",
    ),
    (
        "counting",
        "pure rhythm",
        "One, two, three, four, five, six, seven.",
    ),
    (
        "diffusion",
        "next station's subject",
        "Diffusion models turn pure noise into an image, one step at a time.",
    ),
]


def main() -> None:
    out_path = Path(__file__).resolve().parents[1] / "public" / "data" / "attention.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL, attn_implementation="eager", output_attentions=True
    )
    model.eval()

    sentences = []
    for sid, label, text in SENTENCES:
        enc = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            out = model(**enc)
        ids = enc["input_ids"][0].tolist()
        raw_tokens = tokenizer.convert_ids_to_tokens(ids)
        # "Ġ" marks a token that begins a new word (leading space in GPT-2 BPE)
        tokens = [t.lstrip("Ġ") for t in raw_tokens]
        starts = [i == 0 or t.startswith("Ġ") for i, t in enumerate(raw_tokens)]

        n_layers = len(out.attentions)
        attn = []
        for layer in range(n_layers):
            a = out.attentions[layer][0]  # [heads, T, T]
            heads = []
            for h in range(a.shape[0]):
                m = a[h]
                rows = [[round(float(m[i, j]), 3) for j in range(i + 1)] for i in range(m.shape[0])]
                heads.append(rows)
            attn.append(heads)

        sentences.append(
            {
                "id": sid,
                "label": label,
                "text": text,
                "tokens": tokens,
                "starts": starts,
                "attn": attn,
            }
        )
        print(f"{sid}: {len(tokens)} tokens")

    data = {
        "model": MODEL,
        "layers": len(sentences[0]["attn"]),
        "heads": len(sentences[0]["attn"][0]),
        "sentences": sentences,
    }
    out_path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
