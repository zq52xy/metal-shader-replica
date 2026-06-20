// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Default shader source path and selected material uniform overrides.
// OUTPUT: Clickable demo presets that change selected mode and showcase uniforms.
// POS: Own demo metadata and uniform overrides only.

import { DEFAULT_SOURCE } from "./shaderPresets";
import type { ShaderMode, UniformValue } from "./types";

export type DemoPreset = {
  id: string;
  mode: ShaderMode;
  modeLabel: string;
  source: string;
  sourceName: string;
  title: string;
  uniforms: Partial<Record<string, UniformValue>>;
};

export const SHOWCASE_MODE_UNIFORMS: Record<ShaderMode, Partial<Record<string, UniformValue>>> = {
  gradient: {
    u_bend: 0.2,
    u_contour: 0.5,
    u_pushAmount: 7,
    u_seed: 9,
    u_turbAmp: 0.18,
    u_waveFreq: 2.1,
  },
  glass: {
    u_bend: 0.78,
    u_brightness: 0.84,
    u_bumpDist: 11,
    u_bumpStrength: 0.78,
    u_contour: 0.08,
    u_scale: 0.3,
    u_seed: 22,
    u_shapeContour: 0.46,
    u_warp: 0.68,
    u_warpDepth: 3.2,
  },
  spectrum: {
    u_angle: 214,
    u_bend: 0.22,
    u_density: 0.11,
    u_edge: 1.25,
    u_exposure: 1.7,
    u_glow: 0.95,
    u_noiseAmount: 0.35,
    u_offset: 0.31,
    u_saturation: 1.35,
  },
  crystal: {
    u_bgOffsetX: -0.15,
    u_bgOffsetY: 0.7,
    u_bgScale: 1.32,
    u_bgWarp: 15,
    u_borderStrength: 1.2,
    u_brightness: 1.06,
    u_contour: 0.42,
    u_rimStrength: 2.4,
    u_saturation: 1.1,
    u_strength: 0.42,
  },
};

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "apple-gradient",
    mode: "gradient",
    modeLabel: "Gradient",
    source: DEFAULT_SOURCE,
    sourceName: "apple-logo-trimmed.png",
    title: "Blue Apple",
    uniforms: {
      u_bend: 0.18,
      u_contour: 0.52,
      u_pushAmount: 7,
      u_seed: 9,
      u_turbAmp: 0.18,
      u_waveFreq: 2.1,
    },
  },
  {
    id: "liquid-chrome",
    mode: "glass",
    modeLabel: "Liquid",
    source: DEFAULT_SOURCE,
    sourceName: "apple-logo-trimmed.png",
    title: "Liquid Chrome",
    uniforms: {
      u_bend: 0.85,
      u_brightness: 0.86,
      u_bumpDist: 12,
      u_bumpStrength: 0.85,
      u_contour: 0.08,
      u_scale: 0.32,
      u_seed: 22,
      u_shapeContour: 0.44,
      u_warp: 0.72,
      u_warpDepth: 3.6,
    },
  },
  {
    id: "prism-edge",
    mode: "spectrum",
    modeLabel: "Spectrum",
    source: DEFAULT_SOURCE,
    sourceName: "apple-logo-trimmed.png",
    title: "Prism Edge",
    uniforms: {
      u_angle: 214,
      u_bend: 0.2,
      u_density: 0.12,
      u_edge: 1.35,
      u_exposure: 1.8,
      u_glow: 1,
      u_noiseAmount: 0.35,
      u_offset: 0.33,
      u_saturation: 1.45,
    },
  },
  {
    id: "cosmic-glass",
    mode: "crystal",
    modeLabel: "Crystal",
    source: DEFAULT_SOURCE,
    sourceName: "apple-logo-trimmed.png",
    title: "Cosmic Glass",
    uniforms: {
      u_bgOffsetX: -0.15,
      u_bgOffsetY: 0.7,
      u_bgScale: 1.35,
      u_bgWarp: 16,
      u_borderStrength: 1.25,
      u_brightness: 1.08,
      u_contour: 0.42,
      u_rimStrength: 2.6,
      u_saturation: 1.12,
      u_strength: 0.45,
    },
  },
];
