import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A numbered narrative section: mono index + display heading on a hairline
 * rail, serif prose underneath, optional figure (interactive) slot.
 */
export function Section({
  index,
  title,
  children,
  figure,
  figureLabel,
  className,
}: {
  index: string;
  title: string;
  children: ReactNode;
  figure?: ReactNode;
  figureLabel?: string;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-3xl px-6", className)}>
      <div className="flex items-baseline gap-4 border-b border-border pb-3">
        <span className="readout text-sm text-station">{index}</span>
        <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      </div>
      <div className="prose-lab mt-6">{children}</div>
      {figure && (
        <figure className="mt-8">
          {figure}
          {figureLabel && (
            <figcaption className="label-tech mt-3 text-center">{figureLabel}</figcaption>
          )}
        </figure>
      )}
    </section>
  );
}
