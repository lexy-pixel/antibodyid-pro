import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";
import BellsApp from "./BellsApp";
import { ToolNav } from "./ToolNav";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <ToolNav current="bells" />
    <header className="bells-title">
      <h1>Antibody Rule-Out Tool: Bells and Whistles for Schneck</h1>
    </header>
    <BellsApp />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* installability is optional; the worksheet still runs without a worker */
    });
  });
}
