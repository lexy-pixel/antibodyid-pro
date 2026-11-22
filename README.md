# AntibodyID Pro: Schneck Edition

Two antibody identification worksheets for blood bank techs, using Grifols Search-Cyte Plus 0.8% screen cells and Data-Cyte Plus panel cells and Schneck Medical Center rules.

This is a bench aid. Antigrams and posted charts were transcribed from photos. Always verify the printed antigram for the lot in use and follow your SOP.

- **AntibodyID Pro: Schneck Edition:** https://lexy-pixel.github.io/antibodyid-pro/
- **Antibody Rule-Out Tool: Bells and Whistles for Schneck:** https://lexy-pixel.github.io/antibodyid-pro/bells-and-whistles/

Each page has a link to the other.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/antibodyid-pro/ and http://localhost:5173/antibodyid-pro/bells-and-whistles/ (the `/antibodyid-pro/` base path matches GitHub Pages).

```bash
npm run verify   # row counts vs both canvas sources, plus a render check
npm run build    # verify, typecheck, and write dist/
npm run preview  # serve dist/ at http://localhost:4173/antibodyid-pro/
```

The site is static React + Vite. The Pro page can be installed to a phone home screen (manifest, icons, and a small service worker).

## Go live on GitHub Pages

Pushes to `main` run `.github/workflows/pages.yml`, which builds the site and deploys it with `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

1. Merge into `main`.
2. In the repository, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions** if it is not already.
3. When the **Deploy GitHub Pages** workflow is green, both URLs above are live.

## What's in the worksheets

Both pages carry the same antigrams and reference charts. AntibodyID Pro steps through lots, reactions, interpretation, units, and reference. Bells and Whistles shows those sections on one page.

- Screen and panel lots, including lot 6435 26023 and 6100 26023 (exp 2026-12-19). A lot is expired only after its expiration date, using the viewer's local date. The default lot is the newest non-expired lot. Additional expired panel stays off by default.
- Schneck rules on by default, following the 11/2026 Blood Bank Tech Guide: one nonreactive cell rules out; double-dose required for C, c, E, e, Fyᵃ, Fyᵇ, Jkᵃ, Jkᵇ, M, N, S, s (and k as K−k+); single-dose permitted for D, K, P₁, Xgᵃ, Leᵃ, Leᵇ, Luᵃ; Anti-D detected allows one nonreactive D− C+c+ or D− E+e+ cell for C or E
- Rule of Three (3+/3−) is the default confirmation; Rule of Two (2+/2−) is a separate switch
- Transfused-in-the-last-3-months and positive-IgG-DAT switches, with a stop on routine serologic phenotyping
- Include screen cells in cross-outs. AntibodyID Pro defaults this on and marks SC I and SC II NOT COUNTED when it is off. Bells and Whistles defaults it off, grays those rows, and does not use the NOT COUNTED tag
- Units-to-screen calculator (Donor unknown by default, live and manual selection)
- Display toggles and print worksheet (landscape, sections expanded, lots and toggles in the header line)
- Reference 5.1–5.8 (frequencies, clinical significance, phenotypes, antibody frequencies, Bio-Rad chart of 22 systems and 59 antibodies, dosage table of 14 rows, superseded Schneck Helpful Hints of 7 rules) and 5.9–5.14 (Tech Guide, compatibility chart, component selection, cryo and plasma, Ortho Antibody Index chart, Grifols antigen poster), with sources and "not verified" marks kept as transcribed
