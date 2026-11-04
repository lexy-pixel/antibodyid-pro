# Canvas source fixture

`canvas-source.tsx` is the AntibodyID Pro canvas program with the upload wrapper removed. `scripts/verify-counts.mjs` fails if `src/App.tsx` drifts from this file, other than the import lines that point at the local React components.
