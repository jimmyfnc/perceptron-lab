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
import { STATIONS, stationStyle } from "../lib/journey";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Spline+Sans+Mono:wght@400;500;600&display=swap";

const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/725a8d4a-dc56-4730-af95-b2d790c723b9/id-preview-726564cb--cfd30a5a-d955-4d18-90f9-8b7feb88efc0.lovable.app-1781201327999.png";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
        <Link to="/" className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-display text-sm font-bold uppercase tracking-[0.22em]">
            Perceptron&nbsp;Lab
          </span>
          <span className="label-tech hidden xl:inline">/ ml field manual</span>
        </Link>
        <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {STATIONS.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              style={stationStyle(s.hue)}
              title={`${s.title} — ${s.codename}`}
              className="group flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "!text-station" }}
            >
              <span className="text-station/80">{s.num}</span>
              <span className="hidden uppercase lg:inline">{s.title}</span>
            </Link>
          ))}
        </nav>
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
      { title: "Perceptron Lab — an interactive ML field manual" },
      {
        name: "description",
        content:
          "Learn machine learning by playing with it: hand-built interactive visualizations from classical ML to diffusion models.",
      },
      { name: "author", content: "James Caldwell" },
      { property: "og:title", content: "Perceptron Lab — an interactive ML field manual" },
      {
        property: "og:description",
        content:
          "Learn machine learning by playing with it: hand-built interactive visualizations from classical ML to diffusion models.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
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
