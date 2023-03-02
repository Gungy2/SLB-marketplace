import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      "@contract": path.resolve(__dirname, "./src/contracts/index.main.mjs"),
    },
  },
});
