# Metal Shader Replica

## Purpose

Local WebGL recreation of the four-shader Framer reference at `https://organic-apps-976426.framer.app/`.

## Stack

- Vite
- React
- TypeScript
- Native WebGL fragment shaders
- GitHub Pages via GitHub Actions

## Project Map

- `.github/workflows/`: GitHub Pages deployment workflow.
- `docs/`: Public README media and documentation assets.
- `src/`: React UI, WebGL canvas lifecycle, shader presets, and GLSL program source.
- `scripts/`: Local helper scripts for running the app.
- `public/reference/`: Local default SVG/PNG assets for offline rendering, including the apple default heightmap and captured reference assets.
- `eval/`: Visual rendering contract, work contract, reference screenshots/assets, and final evidence.

## Quality Gates

- Keep the `1000x1000` desktop stage proportions aligned with the reference DOM capture.
- Keep four visible WebGL canvases nonblank.
- Keep SVG/PNG replacement available through UI controls.
- Keep GitHub Pages builds using the `/metal-shader-replica/` base path.
- Keep public README media lightweight enough for GitHub rendering.
- Record build, screenshot, console, canvas-pixel, and interaction evidence in `eval/evidence-report.md`.
