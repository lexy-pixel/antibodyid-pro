# AntibodyID Pro: Schneck Edition

Antibody identification worksheet for blood bank techs. It grades Grifols Search-Cyte Plus 0.8% screen cells and Data-Cyte Plus panel cells, applies Schneck Medical Center Ab ID Helpful Hints (on by default), and estimates how many antigen-negative units to screen.

This is a bench aid. Antigrams were transcribed from phone photos. Always verify the printed antigram for the lot in use and follow your SOP.

**Live site:** https://lexy-pixel.github.io/antibodyid-pro/

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/antibodyid-pro/ (the `/antibodyid-pro/` base path matches GitHub Pages).

```bash
npm run verify   # row counts vs the canvas source, plus a render check
npm run build    # verify, typecheck, and write dist/
npm run preview  # serve dist/ at http://localhost:4173/antibodyid-pro/
```

The app is a static React + Vite site. It can be installed to a phone home screen (manifest, icons, and a small service worker).

## Go live on GitHub Pages

Pushes to `main` run `.github/workflows/pages.yml`, which builds the site and deploys it with `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

1. Merge the pull request into `main`.
2. In the repository, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions** if it is not already.
3. The first deployment may wait for the `github-pages` environment. Approve it if GitHub asks.
4. When the **Deploy GitHub Pages** workflow is green, the site is at https://lexy-pixel.github.io/antibodyid-pro/.

## What's in the worksheet

- Screen and panel lots, including expired lots (additional expired panel off by default) and a manufacturer dropdown
- Schneck rules on by default: 2 double-dose cells, single-dose exceptions for D, K, P1, and Xgᵃ (2 cells), Anti-D detected switch, low-frequency tags, otherwise 3 single-dose cells, 2+/3− validation, unexplained positives, and k paired with K
- Units-to-screen calculator (Donor unknown by default, live and manual selection)
- Display toggles, print worksheet (landscape, every step expanded)
- Reference: antigen frequencies, clinical significance, phenotypes, antibody frequencies, Bio-Rad characteristics chart (22 systems, 59 antibodies, legend and bibliography), dosage table (14 rows), and Schneck Helpful Hints (7 rules), with sources and "not verified" marks kept as transcribed
