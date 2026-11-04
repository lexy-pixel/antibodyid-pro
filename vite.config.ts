import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project site: https://lexy-pixel.github.io/antibodyid-pro/
export default defineConfig({
  base: "/antibodyid-pro/",
  plugins: [react()],
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
});
