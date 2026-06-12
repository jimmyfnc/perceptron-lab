import type { ReactNode } from "react";
import { GLOSSARY } from "@/lib/glossary";

/**
 * A jargon term with a plain-words decoder popover (dotted underline,
 * shown on hover or keyboard focus). Use on the FIRST occurrence of a
 * term per page; the prose should still teach — this is a lifeline,
 * not a lecture.
 */
export function Term({ k, children }: { k: string; children: ReactNode }) {
  const def = GLOSSARY[k];
  if (!def) {
    if (import.meta.env.DEV) console.warn(`<Term>: no glossary entry for "${k}"`);
    return <>{children}</>;
  }
  return (
    <span className="term" tabIndex={0}>
      {children}
      <span role="tooltip" className="term-pop">
        {def}
      </span>
    </span>
  );
}
