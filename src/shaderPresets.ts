// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Original Framer shader modules captured from the target site.
// OUTPUT: Mode metadata and exact target-site uniform values.
// POS: Preserve target ordering: Gradient, Liquid, Spectrum, Crystal.

import crystalConfig from "./originalShaders/LogoCrystal.js";
import glassConfig from "./originalShaders/LogoGlass.js";
import gradientConfig from "./originalShaders/LogoGradient.js";
import spectrumConfig from "./originalShaders/LogoSpectrum.js";
import type { ModeSpec, UniformEntry, UniformMap } from "./types";

export const DEFAULT_SOURCE = "/reference/apple-logo-trimmed.png";
export const DEFAULT_BG = "/reference/cosmic-bg.png";

const num = (value: number): UniformEntry => ({ type: "number", value });
const bool = (value: boolean): UniformEntry => ({ type: "boolean", value });
const color = (value: string): UniformEntry => ({ type: "color", value });
const colors = (value: string[]): UniformEntry => ({ type: "array", value });
const image = (value: string): UniformEntry => ({ type: "responsiveimage", value });
const mode = (value: number): UniformEntry => ({ type: "enum", value });

export const MODE_SPECS: ModeSpec[] = [
  {
    id: "gradient",
    label: "Logo Gradient",
    shortLabel: "Gradient",
    fallbackImage: "/reference/target-mode-1.png",
    config: gradientConfig,
    uniforms: {
      u_angle: num(20),
      u_bend: num(0.24),
      u_colorBack: color("rgb(0, 0, 0)"),
      u_colors: colors(["rgb(0, 0, 0)", "rgb(0, 81, 255)", "rgb(13, 170, 255)", "rgb(189, 228, 255)"]),
      u_contour: num(0.8),
      u_image: image(DEFAULT_SOURCE),
      u_motionMode: mode(0),
      u_pushAmount: num(8),
      u_pushRadius: num(1.5),
      u_scale: num(1.2),
      u_seed: num(6),
      u_speed: num(0.6),
      u_turbAmp: num(0.21),
      u_turbFreq: num(1.15),
      u_turbIter: num(7),
      u_waveFreq: num(2.4),
    },
  },
  {
    id: "glass",
    label: "Logo Liquid",
    shortLabel: "Liquid",
    fallbackImage: "/reference/target-mode-2.png",
    config: glassConfig,
    uniforms: {
      u_ambient: num(0),
      u_bend: num(0.65),
      u_brightness: num(0.7),
      u_bumpDist: num(10),
      u_bumpStrength: num(0.7),
      u_colorA: color("rgb(0, 0, 0)"),
      u_colorB: color("rgb(201, 201, 201)"),
      u_colorBack: color("rgb(0, 0, 0)"),
      u_colorHighlight: color("rgb(255, 255, 255)"),
      u_colorShadow: color("rgb(51, 51, 51)"),
      u_contour: num(0.05),
      u_contrast: num(3),
      u_direction: num(0),
      u_dispersion: num(0),
      u_falloff: num(2),
      u_image: image(DEFAULT_SOURCE),
      u_ior: num(0.5),
      u_lacunarity: num(1.7),
      u_lightAngle: num(200),
      u_motionMode: mode(0),
      u_noise: num(0),
      u_octaves: num(3),
      u_persistence: num(0.65),
      u_saturation: num(1),
      u_scale: num(0.2),
      u_seed: num(55),
      u_shapeContour: num(0.7),
      u_speed: num(0.3),
      u_warp: num(0.5),
      u_warpDepth: num(2),
    },
  },
  {
    id: "spectrum",
    label: "Logo Spectrum",
    shortLabel: "Spectrum",
    fallbackImage: "/reference/target-mode-3.png",
    config: spectrumConfig,
    uniforms: {
      u_ambient: num(0),
      u_angle: num(225),
      u_baseColor: color("rgb(68, 68, 68)"),
      u_bend: num(0.34),
      u_colorBack: color("rgb(0, 0, 0)"),
      u_contour: num(1),
      u_deflection: num(3),
      u_density: num(0.08),
      u_dispersion: num(0),
      u_distort: bool(false),
      u_distortSpeed: num(1),
      u_edge: num(1),
      u_exposure: num(1.4),
      u_glow: num(0.7),
      u_grain: num(0),
      u_image: image(DEFAULT_SOURCE),
      u_lineFade: num(0),
      u_noiseAmount: num(0.5),
      u_noiseScale: num(1.5),
      u_offset: num(0.21),
      u_saturation: num(1.2),
      u_speed: num(0.3),
      u_sweepSpeed: num(0),
      u_viscosity: num(0.5),
    },
  },
  {
    id: "crystal",
    label: "Logo Crystal",
    shortLabel: "Crystal",
    fallbackImage: "/reference/target-mode-4.png",
    config: crystalConfig,
    uniforms: {
      u_bgAngle: num(0),
      u_bgOffsetX: num(-0.2),
      u_bgOffsetY: num(1),
      u_bgScale: num(1.2),
      u_bgSpeed: num(0.3),
      u_bgSweep: num(0),
      u_bgTexture: image(DEFAULT_BG),
      u_bgWarp: num(12),
      u_borderStrength: num(1),
      u_brightness: num(1),
      u_clipBackground: bool(true),
      u_colorBack: color("rgb(0, 0, 0)"),
      u_contour: num(0.5),
      u_contrast: num(1),
      u_convex: bool(false),
      u_dispersion: num(0),
      u_falloff: num(3),
      u_image: image(DEFAULT_SOURCE),
      u_noiseScale: num(0.5),
      u_noiseSeed: num(0),
      u_rimStrength: num(2),
      u_saturation: num(1),
      u_strength: num(0.3),
    },
  },
];

export const DEFAULT_UNIFORMS = Object.fromEntries(
  MODE_SPECS.map((modeSpec) => [modeSpec.id, cloneUniforms(modeSpec.uniforms)]),
) as Record<ModeSpec["id"], UniformMap>;

export function cloneUniforms(uniforms: UniformMap): UniformMap {
  return Object.fromEntries(
    Object.entries(uniforms).map(([key, entry]) => [
      key,
      { ...entry, value: Array.isArray(entry.value) ? [...entry.value] : entry.value },
    ]),
  );
}
