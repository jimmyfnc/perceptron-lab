import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { OPERATOR_STATIONS, STATIONS, stationStyle } from "../lib/journey";
import { NavDrawer } from "../components/site/NavDrawer";
import { OG_IMAGE, SITE_NAME } from "../lib/site";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Spline+Sans+Mono:wght@400;500;600&display=swap";

function NavStation({ s }: { s: (typeof STATIONS)[number] }) {
  return (
    <Link
      to={s.path}
      style={stationStyle(s.hue)}
      title={`${s.title} — ${s.codename}`}
      className="group flex items-center gap-1.5 whitespace-nowrap px-2 py-1.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: "!text-station" }}
    >
      <span className="text-station/80">{s.num}</span>
      {/* titles only when there's truly room — at lg widths the rail
          still overflowed and silently clipped 05 (no-scrollbar) */}
      <span className="hidden uppercase xl:inline">{s.navLabel ?? s.title}</span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
      {/* the rail needs ~970px; max-w-6xl caps its slot at ~916 no matter the
          screen, so the header (alone) widens to 7xl where the rail shows.
          if O3 tips it past ~1040, retire the rail and go drawer-everywhere */}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6 2xl:max-w-7xl">
        {/* no tagline up here — at 2xl it used to shove "05" out of the rail;
            the footer carries the subtitle instead */}
        <Link to="/" className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-display text-sm font-bold uppercase tracking-[0.22em]">
            Perceptron&nbsp;Lab
          </span>
        </Link>
        {/* full rail only where titles genuinely fit — O2 pushed that from
            xl to 2xl (measured ~20px headroom at 1280); below 2xl the
            pop-out journey map takes over */}
        <nav className="no-scrollbar hidden items-center gap-1 overflow-x-auto 2xl:flex">
          {STATIONS.map((s) => (
            <NavStation key={s.path} s={s} />
          ))}
          {/* thin divider: the mechanics journey ends, the operator track begins */}
          <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
          {OPERATOR_STATIONS.map((s) => (
            <NavStation key={s.path} s={s} />
          ))}
        </nav>
        <NavDrawer />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6">
        <span className="label-tech">Perceptron Lab — an interactive ML field manual</span>
        <span className="readout text-[11px] text-muted-foreground">
          built by hand · canvas + svg · no chart libraries
        </span>
      </div>
    </footer>
  );
}

function NotFoundComponent() {
  return (
    <div className="grid-paper flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="label-tech">signal lost</p>
        <h1 className="mt-3 font-display text-6xl font-bold">404</h1>
        <p className="prose-lab mt-4">This coordinate isn&rsquo;t on the journey map.</p>
        <div className="mt-8">
          <Link to="/" className="btn-tech">
            &lt;- back to the journey
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="grid-paper flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="label-tech">instrument fault</p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          This page didn&rsquo;t load
        </h1>
        <p className="prose-lab mt-3 text-sm">
          Something went wrong on our end. Try again, or head back to the journey.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-tech"
          >
            try again
          </button>
          <a href="/" className="btn-tech">
            go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "James Caldwell" },
      { name: "theme-color", content: "#15161c" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Perceptron Lab — an interactive ML field manual" },
      {
        name: "twitter:description",
        content:
          "Learn machine learning by playing with it: hand-built interactive visualizations from classical ML to diffusion models.",
      },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: FONTS_HREF },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
