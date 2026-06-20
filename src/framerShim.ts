// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Original Framer shader config modules.
// OUTPUT: Minimal runtime stubs so Vite can import config objects locally.
// POS: Do not implement Framer rendering here; WebGL2 rendering lives elsewhere.

export const ControlType = {
  Array: "array",
  Boolean: "boolean",
  Color: "color",
  Enum: "enum",
  Number: "number",
  ResponsiveImage: "responsiveimage",
} as const;

export function defineShader<T>(config: T): T {
  return config;
}
