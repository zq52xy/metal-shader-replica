// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Original Framer fragment source and uniform map.
// OUTPUT: WebGL2 program utilities compatible with Framer shader fragments.
// POS: Own shader compilation, declarations, texture upload, and uniform writes.

import type { UniformEntry, UniformMap } from "./types";

export type RuntimeProgram = {
  position: number;
  program: WebGLProgram;
};

const vertexSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export function createRuntimeProgram(gl: WebGL2RenderingContext, fragment: string, uniforms: UniformMap) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL2 program");
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, buildFragmentSource(fragment, uniforms)));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
  }
  return { program, position: gl.getAttribLocation(program, "a_position") };
}

export function createTexture(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to create texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  return texture;
}

export function uploadTexture(gl: WebGL2RenderingContext, texture: WebGLTexture, source: TexImageSource) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

export function writeUniforms(
  gl: WebGL2RenderingContext,
  runtime: RuntimeProgram,
  uniforms: UniformMap,
  textures: Record<string, WebGLTexture | null>,
  time: number,
  mouse: { down: number; hover: number; x: number; y: number; vx: number; vy: number },
) {
  gl.useProgram(runtime.program);
  gl.uniform2f(gl.getUniformLocation(runtime.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
  gl.uniform1f(gl.getUniformLocation(runtime.program, "u_pixelRatio"), window.devicePixelRatio || 1);
  gl.uniform1f(gl.getUniformLocation(runtime.program, "u_time"), time);
  gl.uniform4f(gl.getUniformLocation(runtime.program, "u_mousePosition"), mouse.x, mouse.y, mouse.vx, mouse.vy);
  gl.uniform1f(gl.getUniformLocation(runtime.program, "u_mouseHover"), mouse.hover);
  gl.uniform1f(gl.getUniformLocation(runtime.program, "u_mousePointerDown"), mouse.down);
  bindTextureUniform(gl, runtime.program, "u_image_heightmap", textures.u_image_heightmap, 0);
  let unit = 1;
  for (const [key, entry] of Object.entries(uniforms)) {
    if (key === "u_image") continue;
    unit = writeUniform(gl, runtime.program, key, entry, textures[key] ?? null, unit);
  }
}

function buildFragmentSource(fragment: string, uniforms: UniformMap) {
  const declarations = Object.entries(uniforms).flatMap(([key, entry]) => uniformDeclaration(key, entry)).join("\n");
  return `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_image_heightmap;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_time;
uniform vec4 u_mousePosition;
uniform float u_mouseHover;
uniform float u_mousePointerDown;
${declarations}
${fragment}`;
}

function uniformDeclaration(key: string, entry: UniformEntry) {
  if (key === "u_image") return [];
  if (entry.type === "array") return [`uniform vec4 ${key}[8];`, `uniform int ${key}_length;`];
  if (entry.type === "boolean") return [`uniform float ${key};`];
  if (entry.type === "color") return [`uniform vec4 ${key};`];
  if (entry.type === "responsiveimage") return [`uniform sampler2D ${key};`];
  return [`uniform float ${key};`];
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

function writeUniform(gl: WebGL2RenderingContext, program: WebGLProgram, key: string, entry: UniformEntry, texture: WebGLTexture | null, unit: number) {
  if (entry.type === "array" && Array.isArray(entry.value)) {
    const values = entry.value.slice(0, 8).flatMap((item) => parseColor(String(item)));
    while (values.length < 32) values.push(0, 0, 0, 1);
    gl.uniform4fv(gl.getUniformLocation(program, `${key}[0]`), new Float32Array(values));
    gl.uniform1i(gl.getUniformLocation(program, `${key}_length`), entry.value.length);
    return unit;
  }
  if (entry.type === "boolean") gl.uniform1f(gl.getUniformLocation(program, key), entry.value ? 1 : 0);
  if (entry.type === "color") gl.uniform4fv(gl.getUniformLocation(program, key), new Float32Array(parseColor(String(entry.value))));
  if (entry.type === "number" || entry.type === "enum") gl.uniform1f(gl.getUniformLocation(program, key), Number(entry.value));
  if (entry.type === "responsiveimage") {
    bindTextureUniform(gl, program, key, texture, unit);
    return unit + 1;
  }
  return unit;
}

function bindTextureUniform(gl: WebGL2RenderingContext, program: WebGLProgram, key: string, texture: WebGLTexture | null, unit: number) {
  if (!texture) return;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, key), unit);
}

export function parseColor(value: string) {
  const rgb = value.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].split(",").map((part) => Number(part.trim()));
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255, parts[3] ?? 1];
  }
  const hex = value.replace("#", "").trim();
  if (hex.length === 6) {
    return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).concat(1);
  }
  return [0, 0, 0, 1];
}
