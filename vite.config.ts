import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dir = fileURLToPath(new URL(".", import.meta.url));

// Project site: https://lexy-pixel.github.io/antibodyid-pro/
export default defineConfig({
  base: "/antibodyid-pro/",
  plugins: [react()],
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(dir, "index.html"),
        bells: resolve(dir, "bells-and-whistles/index.html"),
      },
    },
  },
});
