# Visual Rendering Contract

## Target

Recreate the reference Framer shader surface at `https://organic-apps-976426.framer.app/`: a black `1000x1000` stage containing four `400x400` shader canvases in a `2x2` grid, with blue glass, silver liquid metal, black chrome, and cosmic blue glass material modes.

## Audience

The user evaluates visual fidelity, shader controllability, and whether SVG/PNG replacement works without manual code edits.

## Surface

- Main route rendered by the local Vite app.
- Four WebGL canvases.
- Parameter controls for each shader mode.
- Image replacement path for SVG and PNG assets.
- Desktop reference viewport `1280x900` and responsive mobile viewport.

## Core User Paths

1. Open the app and compare the four shader tiles to the reference layout.
2. Select a shader mode and adjust its exposed parameters.
3. Replace the source image with an SVG or PNG and see all four modes re-render on the new shape.

## Invariants

- The stage background stays pure black.
- The four tile positions, tile size, and spacing match the reference proportions on desktop.
- Every tile is rendered by WebGL, not by a static final screenshot.
- Each mode exposes meaningful parameters that change the rendered output.
- SVG and PNG replacement must load through the UI without requiring source-code edits.
- Rendering must be nonblank and free of framework error overlays.

## Gates

- Build succeeds.
- Browser screenshot evidence exists for desktop and mobile.
- Canvas-pixel check confirms all four canvases render nonblack content.
- Console check shows no relevant runtime errors.
- Interaction proof changes a shader parameter and uploads or simulates a replacement asset.

## Warnings

The original Framer component code was not fully available from the published site during this run. Fidelity is judged against captured screenshots, visible DOM/layout, downloaded reference PNGs, and reimplemented shader behavior.

## Review

Human review is required for subjective 1:1 visual acceptance, especially highlight flow, material depth, and sparkle density.

## Evidence

`eval/evidence-report.md`

## Baseline Policy

Do not refresh reference screenshots or relax shader checks to hide a mismatch. Any new baseline must cite a new target-site capture and explain why it supersedes the prior evidence.
