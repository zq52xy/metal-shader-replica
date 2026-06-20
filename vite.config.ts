// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Vite build command, React plugin, and local module aliases.
// OUTPUT: Build/dev configuration for local preview and GitHub Pages deploys.
// POS: Own bundler configuration only; keep runtime shader state in src/.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      framer: fileURLToPath(new URL("./src/framerShim.ts", import.meta.url)),
    },
  },
});
