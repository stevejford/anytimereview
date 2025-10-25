import { defineConfig } from "tsdown";

/**
 * Build configuration for Redis HTTP Proxy deployment to Railway.
 *
 * This builds the proxy server from TypeScript to a single JavaScript file
 * that can be executed by Railway.
 *
 * Output: dist/server.js (matches Railway's start command: node dist/server.js)
 *
 * The configuration bundles workspace dependencies (@my-better-t-app/redis) to avoid
 * runtime resolution issues and ensure the redis package is properly included.
 */
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  outDir: "./dist",
  clean: true,
  dts: false,
  noExternal: [/@my-better-t-app\/.*/],
});

