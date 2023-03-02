import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      "@backend": path.resolve(__dirname, "./src/contracts/index.main.mjs"),
    },
  },
});
