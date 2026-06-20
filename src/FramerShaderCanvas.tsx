// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Original Framer shader config, source image, and live uniforms.
// OUTPUT: One WebGL2 canvas rendered through the captured Framer GLSL.
// POS: Own React canvas lifecycle and texture updates only.

import { useEffect, useRef, useState } from "react";
import { createRuntimeProgram, createTexture, uploadTexture, writeUniforms, type RuntimeProgram } from "./framerWebgl";
import { loadImage, makeHeightmap } from "./heightmap";
import type { ModeSpec, UniformMap } from "./types";

type Props = {
  active: boolean;
  mode: ModeSpec;
  onSelect: () => void;
  source: string;
  uniforms: UniformMap;
};

const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

export function FramerShaderCanvas({ active, mode, onSelect, source, uniforms }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<RuntimeProgram | null>(null);
  const uniformsRef = useRef(uniforms);
  const texturesRef = useRef<Record<string, WebGLTexture | null>>({});
  const mouseRef = useRef({ down: 0, hover: 0, x: 0.5, y: 0.5, vx: 0, vy: 0 });
  const [error, setError] = useState<string | null>(null);
  uniformsRef.current = uniforms;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!canvas || !gl) {
      setError("WebGL2 unavailable");
      return;
    }
    canvas.width = 400;
    canvas.height = 400;
    try {
      const runtime = createRuntimeProgram(gl, mode.config.fragment, uniformsRef.current);
      runtimeRef.current = runtime;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.useProgram(runtime.program);
      gl.enableVertexAttribArray(runtime.position);
      gl.vertexAttribPointer(runtime.position, 2, gl.FLOAT, false, 0, 0);
      texturesRef.current.u_image_heightmap = createTexture(gl);
      for (const key of Object.keys(uniformsRef.current)) {
        if (uniformsRef.current[key].type === "responsiveimage" && key !== "u_image") texturesRef.current[key] = createTexture(gl);
      }
      let start = performance.now();
      let lastDraw = 0;
      const render = (now: number) => {
        if (now - lastDraw > 42) {
          lastDraw = now;
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          writeUniforms(gl, runtime, uniformsRef.current, texturesRef.current, (now - start) * 0.001, mouseRef.current);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        frameRef.current = requestAnimationFrame(render);
      };
      frameRef.current = requestAnimationFrame(render);
      return () => {
        start = 0;
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        Object.values(texturesRef.current).forEach((texture) => texture && gl.deleteTexture(texture));
        if (buffer) gl.deleteBuffer(buffer);
        gl.deleteProgram(runtime.program);
      };
    } catch (compileError) {
      setError(compileError instanceof Error ? compileError.message : "Shader compile failed");
    }
  }, [mode.config.fragment]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2");
    const texture = texturesRef.current.u_image_heightmap;
    if (!gl || !texture) return;
    let cancelled = false;
    loadImage(source).then((image) => {
      if (!cancelled) uploadTexture(gl, texture, makeHeightmap(image));
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Image load failed"));
    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2");
    if (!gl) return;
    for (const [key, entry] of Object.entries(uniforms)) {
      const texture = texturesRef.current[key];
      if (entry.type !== "responsiveimage" || key === "u_image" || !texture) continue;
      loadImage(String(entry.value)).then((image) => uploadTexture(gl, texture, image)).catch(() => undefined);
    }
  }, [uniforms]);

  const updatePointer = (event: React.PointerEvent<HTMLButtonElement>, hover: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    mouseRef.current = { ...mouseRef.current, hover, vx: x - mouseRef.current.x, vy: y - mouseRef.current.y, x, y };
  };

  return (
    <button
      className={`shader-tile ${active ? "is-active" : ""}`}
      onClick={onSelect}
      onPointerDown={(event) => {
        mouseRef.current.down = 1;
        updatePointer(event, 1);
      }}
      onPointerLeave={() => {
        mouseRef.current.hover = 0;
        mouseRef.current.down = 0;
      }}
      onPointerMove={(event) => updatePointer(event, 1)}
      onPointerUp={() => {
        mouseRef.current.down = 0;
      }}
      type="button"
    >
      <canvas ref={canvasRef} aria-label={`${mode.label} shader canvas`} data-mode={mode.label} />
      <span>{error ?? mode.label}</span>
    </button>
  );
}
