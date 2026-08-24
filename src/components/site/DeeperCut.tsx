import type { ReactNode } from "react";

/**
 * A fold-out math drawer at the end of a section's prose: the idea the
 * section just taught, now with the actual formulas and worked numbers.
 * Plain <details> — no JS, no hydration cost, and the content stays
 * fully crawlable/indexable whether or not the drawer is open.
 * Voice rule: every formula gets a worked number; no symbol soup.
 */
export function DeeperCut({
  title = "the math",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <details className="group mt-6 border border-border bg-card/40">
      <summary className="label-tech flex cursor-pointer select-none list-none items-center gap-2.5 px-4 py-2.5 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="text-station transition-transform duration-200 group-open:rotate-90"
        >
          ▸
        </span>
        deeper cut · {title}
      </summary>
      <div className="prose-lab border-t border-border px-4 py-4 text-[0.95rem]">{children}</div>
    </details>
  );
}

/** A small centered matrix readout for kernel weights and the like. */
export function MatrixCard({ values, label }: { values: (string | number)[][]; label?: string }) {
  return (
    <div className="my-4 text-center">
      <div
        className="readout inline-grid gap-x-5 gap-y-1 border border-border px-5 py-3 text-sm"
        style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}
      >
        {values.flat().map((v, i) => (
          <span key={i}>{v}</span>
        ))}
      </div>
      {label && <p className="label-tech mt-2">{label}</p>}
    </div>
  );
}
