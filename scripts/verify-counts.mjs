import * as esbuild from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const fixture = fs.readFileSync(path.join(root, "fixtures/canvas-source.tsx"), "utf8");
const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");

function body(src) {
  const marker = "\nconst AG:";
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("Could not find const AG in source");
  return src.slice(i);
}

const fixtureBody = body(fixture);
const appBody = body(app);
if (fixtureBody !== appBody) {
  const n = Math.min(fixtureBody.length, appBody.length);
  let at = 0;
  while (at < n && fixtureBody[at] === appBody[at]) at += 1;
  const line = fixtureBody.slice(0, at).split("\n").length;
  throw new Error(`src/App.tsx diverges from fixtures/canvas-source.tsx near line ${line} of the shared body.\n fixture: ${JSON.stringify(fixtureBody.slice(at, at + 80))}\n app:     ${JSON.stringify(appBody.slice(at, at + 80))}`);
}

const expectedImports = {
  fixture: 'from "grok/canvas"',
  app: 'from "./canvas"',
};
if (!fixture.includes(expectedImports.fixture)) throw new Error("Fixture is missing the grok/canvas import");
if (!app.includes(expectedImports.app)) throw new Error("App is missing the local canvas import");
if (app.includes('from "grok/canvas"')) throw new Error("App still imports grok/canvas");

const EXPORTS =
  "export { LOTS, SCREENS, BIORAD, DOSE, SCH_HINTS, PHENO, ABFREQ, FREQ, SOURCES, SRC2, SIG_EXTRA, NONSIG_EXTRA, AG, EXPIRED_IDX, BRANDS, CLIN, GROUPS, SCHNECK_SINGLE, SCHNECK_LFA };";

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
const fromFixture = await load("fixture", fixture);
const fromApp = await load("app", app);

for (const name of names) {
  const a = JSON.stringify(fromFixture[name]);
  const b = JSON.stringify(fromApp[name]);
  if (a !== b) throw new Error(`Evaluated constant ${name} does not match the canvas source`);
}

const LOTS = fromFixture.LOTS;
const SCREENS = fromFixture.SCREENS;
const BIORAD = fromFixture.BIORAD;
const antibodies = BIORAD.reduce((n, pair) => n + pair[1].length, 0);

function checkLot(kind, lot) {
  const n = lot.cells.length;
  if (lot.donors.length !== n || lot.rh.length !== n || lot.other.length !== n) {
    throw new Error(`${kind} lot ${lot.lot} row counts differ (donors/rh/cells/other)`);
  }
  for (const cells of lot.cells) {
    if (cells.length !== fromFixture.AG.length) {
      throw new Error(`${kind} lot ${lot.lot} antigram row length ${cells.length}, expected ${fromFixture.AG.length}`);
    }
  }
}
for (const lot of LOTS) checkLot("panel", lot);
for (const lot of SCREENS) checkLot("screen", lot);

const counts = {
  panelLots: LOTS.length,
  screenLots: SCREENS.length,
  antigramRows: LOTS.reduce((n, l) => n + l.cells.length, 0) + SCREENS.reduce((n, l) => n + l.cells.length, 0),
  antigens: fromFixture.AG.length,
  bioradSystems: BIORAD.length,
  bioradAntibodies: antibodies,
  dosageRows: fromFixture.DOSE.length,
  schneckHints: fromFixture.SCH_HINTS.length,
  phenotypes: fromFixture.PHENO.length,
  antibodyFrequencies: fromFixture.ABFREQ.length,
  frequencyAntigens: Object.keys(fromFixture.FREQ).length,
  sources: fromFixture.SOURCES.length,
  letteredSources: fromFixture.SRC2.length,
  significantExtra: fromFixture.SIG_EXTRA.length,
  nonsignificantExtra: fromFixture.NONSIG_EXTRA.length,
  clinical: Object.keys(fromFixture.CLIN).length,
  expiredPanelIndexes: fromFixture.EXPIRED_IDX.length,
  brands: fromFixture.BRANDS.length,
  groups: fromFixture.GROUPS.length,
  schneckSingle: fromFixture.SCHNECK_SINGLE.join(","),
  schneckLfa: fromFixture.SCHNECK_LFA.join(","),
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
  schneckSingle: "D,f,K,P1,Xga",
  schneckLfa: "V,Cw,Kpa,Jsa,Lua",
};
for (const [key, value] of Object.entries(expected)) {
  if (counts[key] !== value) throw new Error(`${key}: got ${counts[key]}, expected ${value}`);
}

if (!fixture.includes("not verified")) throw new Error('Source is missing "not verified" marks');
if (!fixture.includes("Bench aid only.")) throw new Error("Source is missing the bench-aid warning");

console.log("Row counts match the canvas source:");
for (const [key, value] of Object.entries(counts)) console.log(`  ${key}: ${value}`);
