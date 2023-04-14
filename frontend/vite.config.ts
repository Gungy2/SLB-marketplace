import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import svg from '@poppanator/sveltekit-svg'
import path from "path";

export default defineConfig({
  plugins: [sveltekit(), svg()],
  resolve: {
    alias: {
      "@backend": path.resolve(__dirname, "./src/contracts/index.main.mjs"),
    },
  },
});
