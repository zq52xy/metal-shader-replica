# Metal Shader Replica

A local React + WebGL shader playground for four material modes:

- Gradient
- Liquid
- Spectrum
- Crystal

The app renders a 2x2 shader stage, exposes per-mode shader parameters, and supports replacing the source heightmap with an SVG or PNG.

## Demo Surface

The default local app uses a trimmed apple PNG as the source heightmap and renders all four material modes at once.

## Features

- Four WebGL shader modes in a reference-like 2x2 stage.
- Per-mode parameter controls for color, contour, motion, depth, noise, lighting, and texture settings.
- SVG and PNG replacement through the UI.
- Collapsible parameter panel with internal scrolling.
- Responsive desktop and mobile layouts.

## Quick Start

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
src/
  App.tsx                 UI state, mode switching, uploads, controls
  FramerShaderCanvas.tsx  WebGL canvas lifecycle
  framerWebgl.ts          Shader compilation and uniform binding
  heightmap.ts            SVG/PNG rasterization and heightmap generation
  shaderPresets.ts        Mode metadata and default uniform values
  originalShaders/        Shader config modules
public/reference/
  apple-logo-trimmed.png  Default heightmap
  cosmic-bg.png           Crystal background texture
scripts/
  start-dev.ps1           Windows helper for starting Vite
eval/
  visual-contract.md      Quality contract
  work-contract.md        Work contract
  evidence-report.md      Validation record
```

## Open Source And Asset Notice

This repository is prepared for GitHub publishing, but public release requires a rights review:

- `src/originalShaders/` contains shader config modules captured from the referenced Framer surface.
- `public/reference/` contains visual assets used by the local shader demo.
- The default apple-shaped PNG may involve brand or trademark considerations.

If you do not own or have permission to publish those files, replace them before making the repository public.

See `NOTICE.md` for the asset and provenance checklist.

## License

MIT, for the project code you own. Third-party or captured assets/code may require separate permission.
