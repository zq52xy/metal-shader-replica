// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Original Framer shader configs and user-edited uniform values.
// OUTPUT: Type contracts consumed by UI controls and WebGL2 renderer.
// POS: Keep shared shape definitions here; no rendering behavior.

export type ShaderMode = "gradient" | "glass" | "spectrum" | "crystal";

export type UniformType = "array" | "boolean" | "color" | "enum" | "number" | "responsiveimage";

export type UniformValue = number | boolean | string | string[];

export type UniformEntry = {
  type: UniformType;
  value: UniformValue;
};

export type UniformMap = Record<string, UniformEntry>;

export type NumericControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
};

export type ColorControl = {
  key: string;
  label: string;
};

export type ShaderConfig = {
  animated?: boolean;
  buffers?: unknown;
  fragment: string;
  heightmapSource?: string;
  mouse?: string;
  propertyControls?: Record<string, Record<string, unknown>>;
  resolutionScale?: number;
  title?: string;
  vertex?: string;
};

export type ModeSpec = {
  id: ShaderMode;
  label: string;
  shortLabel: string;
  fallbackImage: string;
  config: ShaderConfig;
  uniforms: UniformMap;
};
