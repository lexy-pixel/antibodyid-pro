import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProApp from "../src/ProApp";
import BellsApp from "../src/BellsApp";

function check(name: string, html: string, needles: string[]) {
  const missing = needles.filter((n) => !html.includes(n));
  if (missing.length) {
    console.error(`${name} render is missing:\n` + missing.map((n) => `  - ${n}`).join("\n"));
    process.exit(1);
  }
  console.log(`${name} render ok (${html.length} chars).`);
}

check("AntibodyID Pro", renderToStaticMarkup(createElement(ProApp)), [
  "AntibodyID Pro: Schneck Edition",
  "Bench aid only.",
  "Schneck rules ON",
  "Include screen cells in cross-outs",
  "Rule of Two (2+/2−)",
  "Transfused in the last 3 months",
  "Positive IgG DAT",
  "Screen cells counted in cross-outs",
  "Rule of Three (3+/3−)",
  "Schneck Tech Guide (11/2026) rules active.",
  "Print worksheet",
  "6435 26023",
  "6100 26023",
]);

check("Bells and Whistles", renderToStaticMarkup(createElement(BellsApp)), [
  "Antibody Rule-Out Tool: Bells and Whistles for Schneck",
  "Bench aid only.",
  "Show info",
  "Show details",
  "Live result",
  "Patient history",
  "Screen cells NOT counted",
  "Rule of Three (3+/3−)",
  "Transfused in the last 3 months",
  "Positive IgG DAT",
  "5. Reference (5.1–5.14)",
  "Last updated by Alexis Tobias · Nov 21, 2026, 9:47 PM ET",
  "6435 26023",
  "6100 26023",
]);
