// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: SVG/PNG image URL chosen by the user or default reference logo.
// OUTPUT: Aspect-preserving heightmap canvas for original Framer GLSL shaders.
// POS: Own source rasterization and distance-depth generation only.

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  if (!src.startsWith("blob:") && !src.startsWith("data:")) image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();
  return image;
}

export function makeHeightmap(image: HTMLImageElement) {
  const naturalWidth = image.naturalWidth || 32;
  const naturalHeight = image.naturalHeight || 48;
  const scale = 512 / Math.max(naturalWidth, naturalHeight);
  const width = Math.max(2, Math.round(naturalWidth * scale));
  const height = Math.max(2, Math.round(naturalHeight * scale));
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  if (!sourceCtx) throw new Error("Unable to rasterize source image");
  sourceCtx.clearRect(0, 0, width, height);
  sourceCtx.drawImage(image, 0, 0, width, height);
  const input = sourceCtx.getImageData(0, 0, width, height);
  const count = width * height;
  const mask = new Float32Array(count);
  const dist = new Float32Array(count);
  let transparent = false;
  for (let i = 0; i < count; i++) {
    const a = input.data[i * 4 + 3] / 255;
    if (a < 0.98) transparent = true;
  }
  for (let i = 0; i < count; i++) {
    const offset = i * 4;
    const luma = (input.data[offset] * 0.299 + input.data[offset + 1] * 0.587 + input.data[offset + 2] * 0.114) / 255;
    mask[i] = transparent ? input.data[offset + 3] / 255 : smoothstep(0.04, 0.12, luma);
    dist[i] = mask[i] > 0.5 ? 1e6 : 0;
  }
  chamferDistance(dist, width, height);
  const output = sourceCtx.createImageData(width, height);
  const norm = Math.max(6, Math.min(width, height) * 0.072);
  for (let i = 0; i < count; i++) {
    const rawDepth = Math.max(0, Math.min(1, dist[i] / norm));
    const depth = Math.pow(rawDepth, 0.58);
    const m = Math.max(0, Math.min(1, mask[i]));
    output.data[i * 4] = Math.round(depth * 255);
    output.data[i * 4 + 1] = Math.round((1 - m) * 255);
    output.data[i * 4 + 2] = Math.round(m * 255);
    output.data[i * 4 + 3] = 255;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to build heightmap");
  ctx.putImageData(output, 0, 0);
  return canvas;
}

function chamferDistance(dist: Float32Array, width: number, height: number) {
  const diag = 1.41421356;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - width] + 1);
      if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - width - 1] + diag);
      if (x < width - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - width + 1] + diag);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      if (x < width - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      if (y < height - 1) dist[i] = Math.min(dist[i], dist[i + width] + 1);
      if (x < width - 1 && y < height - 1) dist[i] = Math.min(dist[i], dist[i + width + 1] + diag);
      if (x > 0 && y < height - 1) dist[i] = Math.min(dist[i], dist[i + width - 1] + diag);
    }
  }
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
