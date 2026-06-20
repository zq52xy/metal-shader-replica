# Evidence Report

## Summary

Replaced the prior approximate shader with a local WebGL2 runner that imports the target site's four captured Framer shader configs and uses the target uniform values. Outcome: pass.

## Contract

- `eval/visual-contract.md`
- `eval/work-contract.md`

## Environment

- Host: Windows PowerShell
- Working directory: `O:\coding\metal`
- Dev URL: `http://127.0.0.1:5173/`
- Vite: `8.0.16`
- Browser validation: in-app Browser for DOM/compile checks; Playwright fallback for screenshots because Browser CDP screenshot timed out on the heavy original GLSL scene.
- Context7: attempted earlier for docs; tool returned monthly quota exceeded.
- Git: `O:\coding\metal\.git` exists but is empty/invalid; `git status` reports not a git repository.

## Inputs

- Target URL: `https://organic-apps-976426.framer.app/`
- Reference screenshot: `eval/reference/target-fullpage-1280x900.png`
- Captured target page module: `eval/reference/site-source/augiA20Il.js`
- Captured target shader configs:
  - `src/originalShaders/LogoGradient.js`
  - `src/originalShaders/LogoGlass.js`
  - `src/originalShaders/LogoSpectrum.js`
  - `src/originalShaders/LogoCrystal.js`
- Captured target assets:
  - `public/reference/framer-logo-shape.svg`
  - `public/reference/cosmic-bg.png`

## Checks Run

1. `npm run build`
   - Result: pass.
   - Output bundle: `dist/assets/index-DZd-TWh4.js`, `203.18 kB`, gzip `62.38 kB`.
2. Target source inspection
   - Result: pass.
   - Confirmed target uses Framer `<Shader>` with four configs: `LogoGradient`, `LogoGlass`, `LogoSpectrum`, `LogoCrystal`.
   - Confirmed exact target uniforms and layout positions from `augiA20Il.js`.
3. Local browser render
   - Result: pass.
   - Canvas count: `4`.
   - Shader labels: `Logo Gradient`, `Logo Glass`, `Logo Spectrum`, `Logo Crystal`.
   - Console warning/error logs after fix: `0`.
4. Playwright desktop screenshot at `1280x1040`
   - Result: pass.
   - Screenshot: `eval/screenshots/local-framer-glsl-final-1280x1040.png`.
5. Playwright mobile screenshot at `390x900`
   - Result: pass.
   - Screenshot: `eval/screenshots/local-framer-glsl-mobile-390x900.png`.
6. Screenshot pixel scan on desktop screenshot
   - Result: pass.
   - All four target tile regions had nonblack rendered pixels.
   - Report: `eval/render-pixel-report.json`.

## Outputs

- App source: `O:\coding\metal\src`
- Original shader configs: `O:\coding\metal\src\originalShaders`
- Local default assets: `O:\coding\metal\public\reference`
- Build output: `O:\coding\metal\dist`
- Desktop screenshot: `O:\coding\metal\eval\screenshots\local-framer-glsl-final-1280x1040.png`
- Mobile screenshot: `O:\coding\metal\eval\screenshots\local-framer-glsl-mobile-390x900.png`
- Pixel report: `O:\coding\metal\eval\render-pixel-report.json`

## Failures

- Prior implementation was a native approximation and visibly diverged from target material behavior.
- Direct Framer npm runtime was not usable: `framer@3.0.4` is type definitions only, not the published site runtime.
- Browser CDP screenshots timed out on the original GLSL scene; Playwright screenshot fallback succeeded.
- Original Framer heightmap generation is private runtime behavior, so the local runner recreates it with SVG/PNG rasterization plus distance-depth generation.

## Human Review

Human review remains required for final artistic acceptance, but this version now uses the target shader code and target uniform values rather than a hand-authored approximation.

## Baseline Decision

No reference baseline was changed.

## Final Status

Pass.

## Bevel Edge Tuning Pass - 2026-06-20

## Summary

Reduced the local heightmap edge thickness that made `Bevel = 0` still read as visually heavy. The shader source remains the captured Framer GLSL; the fix is in local heightmap generation.

## Changes

- `src/heightmap.ts`: narrowed the distance-depth ramp from `18%` of the short side to `7.2%`.
- `src/heightmap.ts`: changed depth from linear to a faster-saturating curve with `pow(rawDepth, 0.58)`.
- `src/heightmap.ts`: writes green channel as `1 - mask`, matching the shader's opacity fade usage instead of forcing antialiased edges fully opaque.
- `scripts/start-dev.ps1`: added a local helper for starting the Vite dev server.

## Checks Run

1. `npm run build`
   - Result: pass.
   - Output bundle: `dist/assets/index-D9QqGCHv.js`, `203.20 kB`, gzip `62.39 kB`.
2. Built-dist Playwright screenshot using system Chrome
   - Result: pass.
   - Canvas count: `4`.
   - Console errors: `0`.
   - Desktop screenshot: `eval/screenshots/local-framer-glsl-bevel-tuned-1280x1040-v5.png`.
   - Mobile screenshot: `eval/screenshots/local-framer-glsl-bevel-tuned-mobile-390x900-v5.png`.
3. `Bevel = 0` interaction screenshot
   - Result: pass.
   - Confirmed Bevel inputs: `0.00` and `0`.
   - Screenshot: `eval/screenshots/local-framer-glsl-bevel-zero-1280x1040-v5.png`.
4. Pixel scan
   - Result: pass.
   - Report: `eval/render-pixel-report-bevel-tuned.json`.

## Notes

The remaining visible border at `Bevel = 0` is mainly from the shader's `Contour` uniform, which is still `0.8` in the captured target preset. Lowering `Contour` makes the outline thinner, but that would no longer be the exact target uniform value.

## Apple PNG Default Pass - 2026-06-20

## Summary

Changed the default replacement source from the captured Framer logo SVG to the local trimmed apple PNG.

## Changes

- `public/reference/apple-logo-trimmed.png`: added the default apple PNG static asset.
- `src/shaderPresets.ts`: set `DEFAULT_SOURCE` to `/reference/apple-logo-trimmed.png`.
- `src/App.tsx`: updated initial and reset source name to `apple-logo-trimmed.png`.
- `public/CLAUDE.md` and `public/reference/CLAUDE.md`: documented the static asset directories.

## Checks Run

1. `npm run build`
   - Result: pass.
   - Output bundle: `dist/assets/index-C1BMg6mq.js`, `203.20 kB`, gzip `62.39 kB`.
2. Built-dist Playwright screenshot using system Chrome
   - Result: pass.
   - Canvas count: `4`.
   - Source label: `apple-logo-trimmed.png`.
   - Console errors: `0`.
   - Desktop screenshot: `eval/screenshots/local-apple-default-1280x1040.png`.
   - Mobile screenshot: `eval/screenshots/local-apple-default-mobile-390x900.png`.
3. Pixel scan
   - Result: pass.
   - Report: `eval/render-pixel-report-apple-default.json`.

## Notes

The source root still keeps `Apple-Logo-trimmed.png` as the original user-provided file; the served app uses the copied asset under `public/reference/`.

## Collapsible Panel Pass - 2026-06-20

## Summary

Improved the parameter panel so it can collapse and so long control lists scroll inside the panel instead of overflowing the viewport.

## Changes

- `src/App.tsx`: added `panelCollapsed` state, a top toolbar, an accessible collapse toggle, and a hidden panel content region for collapsed state.
- `src/styles.css`: changed the page layout to a fixed grid with a `320px` open panel and `52px` collapsed rail.
- `src/styles.css`: added `100vh` panel containment, internal vertical scrolling, responsive `70vh` mobile panel limit, and overflow-safe file/source/slider rows.
- `src/CLAUDE.md`: updated source module responsibilities for collapsible panel state and layout.

## Checks Run

1. `npm run build`
   - Result: pass.
   - Output bundle: `dist/assets/index-BuJmjRHY.js`, `203.74 kB`, gzip `62.53 kB`.
   - Output CSS: `dist/assets/index-CgVshGL_.css`, `5.28 kB`, gzip `1.63 kB`.
2. Built-dist Playwright validation using system Chrome
   - Result: pass.
   - Canvas count: `4`.
   - Source label present: `apple-logo-trimmed.png`.
   - Console errors: `0`.
   - Desktop open screenshot: `eval/screenshots/local-ui-panel-open-1280x900.png`.
   - Desktop collapsed screenshot: `eval/screenshots/local-ui-panel-collapsed-1280x900.png`.
   - Mobile screenshot: `eval/screenshots/local-ui-panel-mobile-390x900.png`.
3. Layout metrics
   - Result: pass.
   - Desktop open document width equals viewport width: `1280`.
   - Desktop open panel content scrolls internally: `847` client height, `1702` scroll height.
   - Desktop collapsed panel width: `52`.
   - Mobile document width equals viewport width: `390`.
   - Report: `eval/ui-panel-layout-report.json`.

## Notes

The Browser plugin path was not available in the active tool set, so validation used the regular Playwright fallback with installed system Chrome.

## GitHub Pages Deployment Pass - 2026-06-20

## Summary

Prepared the repo for a hosted GitHub Pages demo at `https://zq52xy.github.io/metal-shader-replica/`.

## Changes

- `.github/workflows/deploy.yml`: builds `dist/` and deploys it with GitHub Pages Actions.
- `package.json`: added `build:pages` and `preview:pages` scripts.
- `vite.config.ts`: documented Vite build/deploy ownership.
- `src/shaderPresets.ts`: changed public asset URLs to follow `import.meta.env.BASE_URL`.
- `README.md`: documented the live demo URL and Pages build commands.
- `CLAUDE.md`, `.github/CLAUDE.md`, `.github/workflows/CLAUDE.md`, `public/reference/CLAUDE.md`: updated module maps.

## Checks Run

1. `npm run build`
   - Result: pass.
   - Output bundle: `dist/assets/index-DsgoFGSz.js`, `206.20 kB`, gzip `63.21 kB`.
2. `npm run build:pages`
   - Result: pass.
   - Output bundle: `dist/assets/index-RaQCJ7aU.js`, `206.22 kB`, gzip `63.22 kB`.
   - Output CSS: `dist/assets/index-BU6YAKnt.css`, `5.99 kB`, gzip `1.74 kB`.
   - HTML asset base: `/metal-shader-replica/`.
3. Pages-path static asset checks at `http://127.0.0.1:4174/metal-shader-replica/`
   - Result: pass.
   - HTML status: `200`.
   - JS asset: `200`, `206224` bytes.
   - CSS asset: `200`, `5992` bytes.
   - Apple PNG asset: `200`, `10421` bytes.
4. Playwright MCP rendered validation
   - Result: pass.
   - Desktop canvas count: `4`.
   - Demo buttons visible: `Blue Apple`, `Liquid Chrome`, `Prism Edge`, `Cosmic Glass`.
   - `Liquid Chrome` click updates heading to `Logo Liquid`.
   - Console errors/warnings: `0`.
   - Report: `eval/github-pages-preview-report.json`.
5. Screenshot evidence
   - Result: pass.
   - Desktop screenshot: `eval/screenshots/github-pages-preview-1280x900.png`.
   - Interaction screenshot: `eval/screenshots/github-pages-preview-liquid-1280x900.png`.
   - Mobile screenshot: `eval/screenshots/github-pages-preview-mobile-390x900.png`.

## Notes

Context7 documentation lookup for Vite was blocked by monthly quota, so deployment details were checked against official Vite and GitHub Pages documentation by web fallback.

## Liquid Label Pass - 2026-06-20

## Summary

Renamed the visible Glass mode label to Liquid while preserving the internal `glass` mode id and captured `LogoGlass.js` shader binding.

## Changes

- `src/shaderPresets.ts`: changed `Logo Glass` to `Logo Liquid`.
- `src/shaderPresets.ts`: changed tab `Glass` to `Liquid`.

## Checks Run

1. `npm run build`
   - Result: pass.
   - Output bundle: `dist/assets/index-BG63_a8U.js`, `203.74 kB`, gzip `62.53 kB`.
2. Built-dist Playwright validation using system Chrome
   - Result: pass.
   - Visible tabs: `Gradient`, `Liquid`, `Spectrum`, `Crystal`.
   - Visible `Glass` / `Logo Glass` labels: `0`.
   - Canvas count: `4`.
   - Console errors: `0`.
- Screenshot: `eval/screenshots/local-liquid-label-1280x900.png`.

## Demo Effects Pass - 2026-06-20

## Summary

Added four clickable demo effect presets so the app can quickly show distinct tuned material looks using the default apple PNG.

## Changes

- `src/demoPresets.ts`: added demo metadata plus showcase uniform overrides for all four shader modes.
- `src/App.tsx`: added active demo state and demo preset application.
- `src/styles.css`: added compact demo preset controls inside the parameter panel.
- `src/CLAUDE.md` and `README.md`: documented the demo preset module.

## Checks Run

1. `npm run build`
   - Result: pass.
   - Output bundle: `dist/assets/index-wVYu-fSn.js`, `206.15 kB`, gzip `63.19 kB`.
   - Output CSS: `dist/assets/index-BU6YAKnt.css`, `5.99 kB`, gzip `1.74 kB`.
2. Built-dist Playwright validation using system Chrome
   - Result: pass.
   - Demo clicks tested: `Blue Apple`, `Liquid Chrome`, `Prism Edge`, `Cosmic Glass`.
   - Active tabs after click: `Gradient`, `Liquid`, `Spectrum`, `Crystal`.
   - Source label after each click: `apple-logo-trimmed.png`.
   - Canvas count after each click: `4`.
   - Console errors: `0`.
   - Report: `eval/demo-effects-report.json`.
3. Desktop screenshot evidence at `1280x900`
   - Result: pass.
   - Screenshots:
     - `eval/screenshots/local-demo-blue-apple-1280x900-v3.png`
     - `eval/screenshots/local-demo-liquid-chrome-1280x900-v3.png`
     - `eval/screenshots/local-demo-prism-edge-1280x900-v3.png`
     - `eval/screenshots/local-demo-cosmic-glass-1280x900-v3.png`
4. Mobile layout evidence at `390x900`
   - Result: pass.
   - Document width equals viewport width: `390`.
   - Demo buttons visible: `4`.
   - Screenshot: `eval/screenshots/local-demo-effects-mobile-390x900-v3.png`.

## Notes

The Browser plugin path was not available in the active tool set, so validation used the regular Playwright fallback with installed system Chrome.
