import * as esbuild from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");

const PAIRS = [
  ["fixtures/pro-canvas-source.tsx", "src/ProApp.tsx", "AntibodyID Pro"],
  ["fixtures/bells-canvas-source.tsx", "src/BellsApp.tsx", "Bells and Whistles"],
];

function body(src) {
  const marker = "\nconst AG:";
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("Could not find const AG in source");
  return src.slice(i);
}

const EXPORTS =
  "export { LOTS, SCREENS, BIORAD, DOSE, SCH_HINTS, PHENO, ABFREQ, FREQ, SOURCES, SRC2, SIG_EXTRA, NONSIG_EXTRA, AG, EXPIRED_IDX, BRANDS, CLIN, GROUPS, SCHNECK_SINGLE, SCHNECK_DOUBLE, SCHNECK_LFA, SCH_N, TG1, TG2, TG3, TG4, COMPAT, SELC, ORTHO, GRIF, GRIF_FOOT, GRIF_REFS, CRYO, PLASMA };";

function dataPrefix(src) {
  const cut = src.split("export default function App")[0];
  return cut.replace(/^import[\s\S]*?;\r?\n/gm, "");
}

async function load(name, src) {
  const ts = `${dataPrefix(src)}\n${EXPORTS}\n`;
  const result = await esbuild.transform(ts, { loader: "ts", format: "esm" });
  const file = path.join(os.tmpdir(), `antibodyid-${name}-${process.pid}.mjs`);
  fs.writeFileSync(file, result.code);
  return import(pathToFileURL(file).href);
}

const names = EXPORTS.replace("export {", "").replace("};", "").split(",").map((s) => s.trim());
const loaded = [];

for (const [fixtureRel, appRel, label] of PAIRS) {
  const fixture = fs.readFileSync(path.join(root, fixtureRel), "utf8");
  const app = fs.readFileSync(path.join(root, appRel), "utf8");
  if (body(fixture) !== body(app)) {
    const a = body(fixture);
    const b = body(app);
    const n = Math.min(a.length, b.length);
    let at = 0;
    while (at < n && a[at] === b[at]) at += 1;
    const line = a.slice(0, at).split("\n").length;
    throw new Error(`${appRel} diverges from ${fixtureRel} near shared-body line ${line}.\n fixture: ${JSON.stringify(a.slice(at, at + 80))}\n app:     ${JSON.stringify(b.slice(at, at + 80))}`);
  }
  if (!fixture.includes('from "grok/canvas"')) throw new Error(`${fixtureRel} is missing the grok/canvas import`);
  if (!app.includes('from "./canvas"')) throw new Error(`${appRel} is missing the local canvas import`);
  if (app.includes('from "grok/canvas"')) throw new Error(`${appRel} still imports grok/canvas`);
  for (const heading of ["5.9 ", "5.10 ", "5.11 ", "5.12 ", "5.13 ", "5.14 "]) {
    if (!fixture.includes(heading)) throw new Error(`${label} source is missing heading ${heading}`);
  }
  if (!fixture.includes("NOT COUNTED")) throw new Error(`${label} source is missing NOT COUNTED`);
  if (!fixture.includes("Bench aid only.")) throw new Error(`${label} source is missing the bench-aid warning`);
  if (!fixture.includes("not verified")) throw new Error(`${label} source is missing "not verified" marks`);

  const fromFixture = await load(label.replace(/\W+/g, "-") + "-fixture", fixture);
  const fromApp = await load(label.replace(/\W+/g, "-") + "-app", app);
  for (const name of names) {
    if (JSON.stringify(fromFixture[name]) !== JSON.stringify(fromApp[name])) {
      throw new Error(`${label}: evaluated constant ${name} does not match the canvas source`);
    }
  }
  const antibodies = fromFixture.BIORAD.reduce((n, pair) => n + pair[1].length, 0);
  const orthoRows = fromFixture.ORTHO.reduce((n, pair) => n + pair[1].length, 0);
  const grifRows = fromFixture.GRIF.reduce((n, pair) => n + pair[1].length, 0);
  const counts = {
    panelLots: fromFixture.LOTS.length,
    screenLots: fromFixture.SCREENS.length,
    antigramRows: fromFixture.LOTS.reduce((n, l) => n + l.cells.length, 0) + fromFixture.SCREENS.reduce((n, l) => n + l.cells.length, 0),
    antigens: fromFixture.AG.length,
    bioradSystems: fromFixture.BIORAD.length,
    bioradAntibodies: antibodies,
    dosageRows: fromFixture.DOSE.length,
    schneckHints: fromFixture.SCH_HINTS.length,
    techGuideSections: [fromFixture.TG1.length, fromFixture.TG2.length, fromFixture.TG3.length, fromFixture.TG4.length].join("+"),
    compatRows: fromFixture.COMPAT.length,
    componentRows: fromFixture.SELC.length,
    orthoSystems: fromFixture.ORTHO.length,
    orthoRows,
    grifGroups: fromFixture.GRIF.length,
    grifRows,
    grifFootnotes: fromFixture.GRIF_FOOT.length,
    grifRefs: fromFixture.GRIF_REFS.length,
    cryoRows: fromFixture.CRYO.length,
    plasmaRows: fromFixture.PLASMA.length,
    schneckDouble: fromFixture.SCHNECK_DOUBLE.join(","),
    schneckSingle: fromFixture.SCHNECK_SINGLE.join(","),
    schneckLfa: fromFixture.SCHNECK_LFA.join(","),
    schN: fromFixture.SCH_N,
  };
  const expected = {
    bioradSystems: 22,
    bioradAntibodies: 59,
    dosageRows: 14,
    schneckHints: 7,
    panelLots: 6,
    screenLots: 29,
    antigramRows: 124,
    antigens: 22,
    schneckDouble: "C,c,E,e,Fya,Fyb,Jka,Jkb,M,N,S,s",
    schneckSingle: "D,K,P1,Xga,Lea,Leb,Lua,Lub",
    schneckLfa: "V,Cw,Kpa,Jsa,Lua",
    schN: 1,
    techGuideSections: "3+2+3+3",
    compatRows: 8,
    componentRows: 6,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (counts[key] !== value) throw new Error(`${label} ${key}: got ${counts[key]}, expected ${value}`);
  }
  for (const lot of [...fromFixture.LOTS, ...fromFixture.SCREENS]) {
    const n = lot.cells.length;
    if (lot.donors.length !== n || lot.rh.length !== n || lot.other.length !== n) {
      throw new Error(`${label} lot ${lot.lot} row counts differ`);
    }
    for (const cells of lot.cells) {
      if (cells.length !== fromFixture.AG.length) throw new Error(`${label} lot ${lot.lot} antigram length ${cells.length}`);
    }
  }
  loaded.push({ label, counts, data: fromFixture });
  console.log(`${label} row counts match the canvas source:`);
  for (const [key, value] of Object.entries(counts)) console.log(`  ${key}: ${value}`);
}

const [pro, bells] = loaded;
const shared = ["LOTS", "SCREENS", "BIORAD", "DOSE", "SCH_HINTS", "TG1", "TG2", "TG3", "TG4", "COMPAT", "SELC", "ORTHO", "GRIF", "CRYO", "PLASMA", "FREQ", "CLIN"];
for (const name of shared) {
  if (JSON.stringify(pro.data[name]) !== JSON.stringify(bells.data[name])) {
    console.log(`Note: ${name} differs between the two canvas sources; each page keeps its own copy.`);
  }
}
