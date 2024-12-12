import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  minify: true,
  sourcemap: true,
  target: "es2020",
  splitting: false,
  external: ["fsevents","esbuild"],
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      ".node": "file",
    };
  },
});