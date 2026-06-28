import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  outExtension() {
    return { js: ".es.js" };
  },
  dts: { resolve: true },
  splitting: false,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  treeshake: false,
});
