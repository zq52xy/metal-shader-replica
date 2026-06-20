# Source Module

## Responsibility

`src/` owns the browser application that renders and controls the shader replica.

## Members

- `main.tsx`: React bootstrap.
- `App.tsx`: UI state, mode selection, demo preset application, upload replacement, collapsible panel state, and original uniform controls.
- `demoPresets.ts`: Demo effect metadata and mode-specific uniform overrides.
- `FramerShaderCanvas.tsx`: WebGL2 canvas lifecycle for captured Framer GLSL shaders.
- `framerWebgl.ts`: WebGL2 shader compilation, texture binding, and uniform writes.
- `framerShim.ts`: Minimal `framer` import shim for captured shader config modules.
- `heightmap.ts`: SVG/PNG rasterization and distance-depth heightmap generation.
- `originalShaders/`: Captured Framer shader config modules from the reference site.
- `shaderPresets.ts`: Original shader config routing, exact target uniforms, and default asset paths.
- `types.ts`: Shared TypeScript contracts.
- `styles.css`: Stage layout, responsive behavior, collapsible panel layout, and control styling.
- `vite-env.d.ts`: Vite client type declarations.

## Boundaries

- Do not put shader GLSL in React components; captured source stays in `originalShaders/`.
- Do not put DOM upload state in the WebGL program module.
- Keep reference asset paths centralized in `shaderPresets.ts`.
