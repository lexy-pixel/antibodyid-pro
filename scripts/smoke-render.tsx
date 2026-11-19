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
]);

check("Bells and Whistles", renderToStaticMarkup(createElement(BellsApp)), [
  "Antibody Rule-Out Tool: Bells and Whistles for Schneck",
  "Bench aid only.",
  "Include screen cells in cross-outs",
  "Rule of Two (2+/2−)",
  "Transfused in the last 3 months",
  "Positive IgG DAT",
  "3c. Patient antigen typing",
  "do not perform routine serologic phenotyping",
  "5.9 Schneck Blood Bank Tech Guide",
  "5.10 Blood Type Compatibility Chart",
  "5.11 Selection of components",
  "5.12 Cryo &amp; Plasma Compatibility",
  "5.13 Ortho Antibody Index Chart",
  "5.14 Grifols Human Blood Group Antigens",
]);
