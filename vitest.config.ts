import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Standalone config: vitest must NOT inherit vite.config.ts, which loads the
// TanStack Start + nitro plugins (server build, route codegen).
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
