// Draws the dunes. Their sand is shaded pixel by pixel, which the 2D canvas the other scenes use can't
// do fast enough, so a small program on the graphics card (dunes.frag) draws them into a canvas of its
// own. The picture is read back from there as plain numbers, and scenes.ts puts it into the page's canvas.
import fragment from './dunes.frag?raw';

/** What the scene is given: a number, or a list of two or three (a size, a colour's red, green and blue). */
export type DuneValues = Record<string, number | number[]>;

interface Painter {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
}

// Made on the first picture and kept: a page may only have a few of these at a time. `null` once
// this browser has turned out not to be able to.
let painter: Painter | null | undefined;

/** A painter, `null` where the browser can't, or nothing when it couldn't just now and may later. */
function start(): Painter | null | undefined {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;
  // The scene's numbers need more digits than some older phones' graphics chips keep.
  if (!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision) return null;
  // A browser that guards against fingerprinting may hand a page noise in place of the picture it drew.
  // One known colour, drawn and read back, tells: where it comes back as something else, no dunes.
  gl.clearColor(0.2, 0.4, 0.6, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const back = new Uint8Array(4);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, back);
  if ([51, 102, 153].some((value, i) => Math.abs(back[i] - value) > 3)) return gl.isContextLost() ? undefined : null;

  const program = gl.createProgram();
  const sources: [number, string][] = [
    [gl.VERTEX_SHADER, 'attribute vec2 corner; void main() { gl_Position = vec4(corner, 0.0, 1.0); }'],
    [gl.FRAGMENT_SHADER, fragment],
  ];
  for (const [kind, source] of sources) {
    const shader = gl.createShader(kind);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  // A graphics card the browser has just taken away fails here too, and may be back for the next picture.
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return gl.isContextLost() ? undefined : null;
  gl.useProgram(program);

  // One triangle that covers the whole picture.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, 'corner');
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);

  // The browser can take the graphics card away (a phone does when the tab has been out of view for
  // long): the next picture starts again.
  canvas.addEventListener('webglcontextlost', () => {
    if (painter?.canvas === canvas) painter = undefined;
  });
  return { canvas, gl, program };
}

/**
 * Draws the top `rows` rows of pixels of a scene `width` by `height`, and returns the picture, or nothing
 * where the browser can't. A picture larger than the graphics card can make comes back smaller, for the
 * caller to stretch.
 */
export function drawDunes(width: number, height: number, rows: number, values: DuneValues): ImageData | undefined {
  if (painter?.gl.isContextLost()) painter = undefined;
  if (painter === undefined) painter = start();
  if (!painter) return undefined;
  const { canvas, gl, program } = painter;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== rows) canvas.height = rows;
  const across = gl.drawingBufferWidth;
  const down = gl.drawingBufferHeight;
  gl.viewport(0, 0, across, down);
  const all: DuneValues = { ...values, resolution: [across, (down * height) / rows] };
  for (const [name, value] of Object.entries(all)) {
    const at = gl.getUniformLocation(program, name);
    if (typeof value === 'number') gl.uniform1f(at, value);
    else if (value.length === 2) gl.uniform2fv(at, value);
    else gl.uniform3fv(at, value);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // The picture is read back as numbers, from its bottom row up, which dunes.frag has made the scene's top.
  // Copying the canvas with drawImage would be less work, but Firefox has been seen to swap red and blue
  // on the way, turning the sand blue (Firefox 159 on Linux, November 2026).
  const pixels = new Uint8Array(across * down * 4);
  gl.readPixels(0, 0, across, down, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return gl.isContextLost() ? undefined : new ImageData(new Uint8ClampedArray(pixels.buffer), across, down);
}
