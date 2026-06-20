# Work Contract

## Work Target

Build a local WebGL shader tool that recreates the reference site's four shader modes, exposes mode-specific parameters, and supports SVG/PNG image replacement.

## Parent Contract

`eval/visual-contract.md`

## Core User Paths

1. App loads into the four-mode shader surface.
2. A user switches the focused mode and changes visible parameters.
3. A user replaces the source asset with an SVG or PNG and the shader tiles update.

## Done Definition

- Vite app files are present and runnable.
- Four shader modes render in the same visual arrangement as the reference.
- Each mode has exposed controls for its material behavior.
- Replacement image input accepts `.svg` and `.png`.
- Evidence records build, browser screenshots, console status, canvas-pixel checks, and interaction proof.

## Invariants

- The implementation does not depend on copying proprietary Framer runtime code verbatim.
- Default reference assets stay available for comparison.
- Controls must not obscure the reference-like shader grid on desktop.
- Mobile layout must remain usable without overlapping controls and canvases.

## Gates

- `npm run build`
- Local browser render check.
- Desktop screenshot.
- Mobile screenshot.
- Canvas nonblank pixel report.
- Parameter-change interaction report.
- Replacement-asset interaction report.

## Evidence Required

`eval/evidence-report.md`

## Human Review

The user remains final judge for exact artistic fidelity.

## Baseline Policy

No baseline update is allowed as part of this implementation unless the target site is recaptured and the reason is recorded in Evidence.
