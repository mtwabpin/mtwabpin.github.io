// Draws the dunes. Their sand is shaded pixel by pixel, which the 2D canvas the other scenes use can't
// do fast enough, so a small program on the graphics card (dunes.frag) draws them into a canvas of its
// own, and scenes.ts copies that picture into the page's.
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
 * Draws the top `drawn` rows of a scene `width` by `height` pixels, and returns the canvas it is on, or
 * nothing where the browser can't. The canvas is used again for the next picture, so copy it at once.
 */
export function drawDunes(width: number, height: number, drawn: number, values: DuneValues): HTMLCanvasElement | undefined {
  if (painter?.gl.isContextLost()) painter = undefined;
  if (painter === undefined) painter = start();
  if (!painter) return undefined;
  const { canvas, gl, program } = painter;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== drawn) canvas.height = drawn;
  // A picture larger than the graphics card can make comes out smaller, and is stretched when copied.
  const across = gl.drawingBufferWidth;
  const down = gl.drawingBufferHeight;
  gl.viewport(0, 0, across, down);
  const all: DuneValues = { ...values, resolution: [across, (down * height) / drawn], drawn: down };
  for (const [name, value] of Object.entries(all)) {
    const at = gl.getUniformLocation(program, name);
    if (typeof value === 'number') gl.uniform1f(at, value);
    else if (value.length === 2) gl.uniform2fv(at, value);
    else gl.uniform3fv(at, value);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return gl.isContextLost() ? undefined : canvas;
}
