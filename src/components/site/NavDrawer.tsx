/**
 * The pop-out journey map: full station index grouped by track, for widths
 * where the header rail can't afford titles (< xl). A compact "map" button
 * unfolds a grid-paper panel under the header — every station with its num,
 * title, codename, LED, and hue. When a third track outgrows the xl rail
 * too, drop the rail and let this serve every width.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { OPERATOR_STATIONS, STATIONS, stationStyle, type Station } from "@/lib/journey";

function DrawerRow({ s, onPick }: { s: Station; onPick: () => void }) {
  return (
    <li>
      <Link
        to={s.path}
        onClick={onPick}
        style={stationStyle(s.hue)}
        className="group flex items-center justify-between gap-3 border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-card"
        activeProps={{ className: "!border-station-dim bg-card" }}
      >
        <span className="flex min-w-0 items-baseline gap-3">
          <span className="readout w-6 shrink-0 text-sm text-station">{s.num}</span>
          <span className="truncate font-display text-sm font-semibold tracking-tight">
            {s.title}
            <span className="ml-2 font-normal text-station">— {s.codename}</span>
          </span>
        </span>
        <span
          aria-hidden
          className="led shrink-0"
          style={{ opacity: s.status === "live" ? 1 : 0.3 }}
        />
      </Link>
    </li>
  );
}

export function NavDrawer() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* escape closes; body scroll locks while the map is out */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        className="btn-tech"
        aria-expanded={open}
        aria-controls="journey-map-drawer"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "× close" : "≡ map"}
      </button>

      {open && (
        <>
          {/* backdrop: everything below the header dims; a tap folds the map */}
          <div
            aria-hidden
            onClick={close}
            className="fixed inset-x-0 bottom-0 top-14 z-40 bg-background/60"
          />
          <div
            id="journey-map-drawer"
            ref={panelRef}
            className="grid-paper animate-rise fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-background"
          >
            <nav className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6" aria-label="All stations">
              <p className="label-tech px-3">Track I · the journey</p>
              <ol className="mt-2">
                {STATIONS.map((s) => (
                  <DrawerRow key={s.path} s={s} onPick={close} />
                ))}
              </ol>
              <p className="label-tech mt-5 border-t border-border px-3 pt-5">
                Track II · the operator&rsquo;s manual
              </p>
              <ol className="mt-2">
                {OPERATOR_STATIONS.map((s) => (
                  <DrawerRow key={s.path} s={s} onPick={close} />
                ))}
              </ol>
              <p className="label-tech mt-5 px-3 text-muted-foreground">
                <span className="led mr-2 inline-block align-middle" style={{ opacity: 1 }} />
                instrument live &nbsp;·&nbsp;
                <span className="led mr-2 inline-block align-middle" style={{ opacity: 0.3 }} />
                in fabrication
              </p>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
