# Reference Assets

## Responsibility

`public/reference/` owns static shader assets served under the active Vite public base, for example `/reference/...` locally and `/metal-shader-replica/reference/...` on GitHub Pages.

## Members

- `apple-logo-trimmed.png`: Default SVG/PNG replacement source for all four shader modes.
- `framer-logo-shape.svg`: Captured reference logo shape kept for comparison.
- `cosmic-bg.png`: Background texture for the Crystal shader mode.
- `target-mode-*.png`: Captured reference mode images for visual comparison.

## Boundaries

- Do not put source-code constants here; use `src/shaderPresets.ts`.
- Do not put evaluation screenshots here; use `eval/screenshots/`.
