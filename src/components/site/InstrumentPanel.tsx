import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Framed "lab instrument" container: hairline border, corner crosshair
 * ticks, a mono title rail, and an optional live readout on the right.
 */
export function InstrumentPanel({
  label,
  readout,
  children,
  className,
  live = false,
}: {
  label: string;
  readout?: ReactNode;
  children: ReactNode;
  className?: string;
  live?: boolean;
}) {
  return (
    <div className={cn("panel panel-ticks", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          {live && <span className="led led-pulse" aria-hidden />}
          <span className="label-tech">{label}</span>
        </div>
        {readout != null && (
          <span className="readout text-[11px] text-muted-foreground">{readout}</span>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
