// Plain Vite config for TanStack Start, built as a Cloudflare Worker by nitro.
// Replaces @lovable.dev/vite-tanstack-config (dropped 2026-11-01 when hosting
// moved to Cloudflare) — this is the production subset of what it wired up.
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      // Fail the build if server-only code is imported into the client bundle.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    // Build-only (dev stays on plain Vite): emits .output/ — Worker, static assets,
    // and a wrangler.json merged from wrangler.jsonc.
    command === "build" && nitro({ preset: "cloudflare-module" }),
    viteReact(),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: { host: "::", port: 8080 },
}));
