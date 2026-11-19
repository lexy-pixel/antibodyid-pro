# Canvas source fixtures

`pro-canvas-source.tsx` and `bells-canvas-source.tsx` are the canvas programs with the upload wrapper removed. `scripts/verify-counts.mjs` fails if `src/ProApp.tsx` or `src/BellsApp.tsx` drifts from its fixture, other than the import lines that point at the local React components.
