import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import App from "../src/App";

const html = renderToStaticMarkup(createElement(App));
const needles = [
  "AntibodyID Pro: Schneck Edition",
  "Bench aid only.",
  "Schneck rules ON",
  "Anti-D detected off",
  "Auto cross-outs ON",
  "Search-Cyte Plus",
  "Data-Cyte Plus",
  "Add an additional panel (expired lots)",
  "Allow heterozygous rule-outs (Rh, Kidd, Duffy, MNS)",
  "Highlight positive rows",
  "Current conclusion",
  "Print worksheet",
  "Manufacturer",
  "ruled out",
  "not excluded",
];

const missing = needles.filter((n) => !html.includes(n));
if (missing.length) {
  console.error("Initial render is missing:\n" + missing.map((n) => `  - ${n}`).join("\n"));
  process.exit(1);
}
console.log(`Initial render ok (${html.length} chars), bench-aid warning visible, Schneck rules default on.`);
