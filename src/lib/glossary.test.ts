import { describe, expect, it } from "vitest";
import { GLOSSARY } from "./glossary";

describe("glossary", () => {
  it("every definition is one short plain sentence", () => {
    for (const [term, def] of Object.entries(GLOSSARY)) {
      expect(def.length, term).toBeGreaterThan(20);
      expect(def.length, term).toBeLessThan(220);
      expect(def.trim(), term).toBe(def);
    }
  });

  it("definitions don't lean on undefined jargon shorthand", () => {
    // a definition may name other glossary terms, but never bare math notation
    for (const [term, def] of Object.entries(GLOSSARY)) {
      expect(def, term).not.toMatch(/[∑∏∂ᾱ]|Qᵀ|√d/);
    }
  });

  it("has the terms the pages lean on", () => {
    for (const k of [
      "gradient",
      "loss",
      "activation",
      "kernel",
      "token",
      "softmax",
      "latent",
      "CFG",
      "LoRA",
      "overfitting",
    ]) {
      expect(GLOSSARY[k], k).toBeDefined();
    }
  });
});
