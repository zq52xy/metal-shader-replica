# Public Assets Module

## Responsibility

`public/` owns static files served directly by Vite.

## Members

- `reference/`: Default shader assets, captured reference assets, and offline textures.

## Boundaries

- Keep runtime asset path constants in `src/shaderPresets.ts`.
- Keep browser upload handling in `src/App.tsx`.
