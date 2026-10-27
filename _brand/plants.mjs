// Engraved, hand-coloured plants for MTWABP In's site, drawn as SVG: fine
// sepia outlines, hatching on the shaded side, and a wash of colour set a
// little off the lines, as a colourist's brush was on old plates.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 100) / 100;
const pt = (p) => `${f(p[0])} ${f(p[1])}`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dir = (ang) => [Math.cos(ang), Math.sin(ang)];
const perp = (ang) => [-Math.sin(ang), Math.cos(ang)];

// A point t of the way along a cubic Bézier, and its heading there.
function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const p = [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
  const d = [
    3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
  return { p, ang: Math.atan2(d[1], d[0]) };
}

export const ink = { line: '#3B2A1E', fine: '#5A4636' };

let clipId = 0;

/// One leaf from [base], heading [ang], [len] long and [wid] wide at its
/// widest: outline, midrib, veins, hatching on one side, and its wash.
export function leaf(base, ang, len, wid, { wash = '#7FA05A', bend = 0.12, veins = 6, r = Math.random, shade = 1 } = {}) {
  const d = dir(ang), n = perp(ang);
  const tip = add(base, add(mul(d, len), mul(n, len * bend)));
  const side = (s) => [
    add(base, add(mul(d, len * 0.22), mul(n, s * wid * 0.95))),
    add(base, add(mul(d, len * 0.72), mul(n, s * wid * 0.55 + len * bend * 0.6))),
  ];
  const [l1, l2] = side(1), [r1, r2] = side(-1);
  const outline = `M${pt(base)} C${pt(l1)} ${pt(l2)} ${pt(tip)} C${pt(r2)} ${pt(r1)} ${pt(base)}Z`;
  const mid = add(base, add(mul(d, len * 0.5), mul(n, len * bend * 0.45)));
  const id = `lf${clipId++}`;
  let out = '';
  // The wash, set a little off the lines and a little loose.
  const off = [1.2 + r() * 1.2, 0.6 + r() * 1.2];
  out += `<path d="${outline}" transform="translate(${f(off[0])} ${f(off[1])})" fill="${wash}" opacity="0.62"/>`;
  out += `<clipPath id="${id}"><path d="${outline}"/></clipPath>`;
  // Veins, from the midrib forward to the edge, both sides.
  let veinPath = '';
  let hatch = '';
  for (let i = 1; i <= veins; i++) {
    const t = i / (veins + 1);
    const m = bez(base, add(base, mul(d, len * 0.3)), mid, tip, t).p;
    for (const s of [1, -1]) {
      const reach = wid * Math.sin(Math.PI * Math.min(1, t * 1.1)) * 0.95;
      const e = add(m, add(mul(d, reach * 0.75), mul(n, s * reach)));
      veinPath += `M${pt(m)} Q${pt(add(m, add(mul(d, reach * 0.15), mul(n, s * reach * 0.6))))} ${pt(e)}`;
    }
  }
  // Hatching on the shaded side: short strokes across, close together.
  const steps = Math.round(len / 2.2);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const m = bez(base, add(base, mul(d, len * 0.3)), mid, tip, t).p;
    const reach = wid * Math.sin(Math.PI * t) * (0.55 + 0.4 * shade);
    const a = add(m, mul(n, -reach * 0.15));
    const b = add(a, add(mul(n, -reach), mul(d, reach * 0.35)));
    hatch += `M${pt(a)} L${pt(b)}`;
  }
  out += `<g clip-path="url(#${id})"><path d="${hatch}" stroke="${ink.fine}" class="fn" stroke-width="0.35" fill="none" opacity="0.8"/><path d="${veinPath}" stroke="${ink.fine}" class="fn" stroke-width="0.45" fill="none"/></g>`;
  out += `<path d="M${pt(base)} C${pt(add(base, mul(d, len * 0.3)))} ${pt(mid)} ${pt(tip)}" stroke="${ink.line}" class="ln" stroke-width="0.7" fill="none"/>`;
  out += `<path d="${outline}" stroke="${ink.line}" class="ln" stroke-width="0.9" fill="none" stroke-linejoin="round"/>`;
  return out;
}

/// A stem along a cubic Bézier, drawn as an engraver would: two lines and
/// the wash between them, thinning toward its end.
export function stem(p0, p1, p2, p3, { w0 = 3, w1 = 1, wash = '#8B7B4E' } = {}) {
  const N = 28;
  const left = [], right = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const { p, ang } = bez(p0, p1, p2, p3, t);
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push(add(p, mul(perp(ang), w)));
    right.push(add(p, mul(perp(ang), -w)));
  }
  const body = `M${left.map(pt).join(' L')} L${right.reverse().map(pt).join(' L')}Z`;
  return `<path d="${body}" fill="${wash}" opacity="0.7"/><path d="${body}" stroke="${ink.line}" class="ln" stroke-width="0.8" fill="none" stroke-linejoin="round"/>`;
}

/// A small round fruit or bud, with a highlight left unhatched.
export function berry(c, rad, { wash = '#B8483A' } = {}) {
  const id = `br${clipId++}`;
  let hatch = '';
  for (let k = -rad; k < rad; k += 1.4) hatch += `M${f(c[0] + k)} ${f(c[1] - rad)} L${f(c[0] + k + rad * 0.6)} ${f(c[1] + rad)}`;
  return `<circle cx="${f(c[0] + 1)}" cy="${f(c[1] + 0.8)}" r="${f(rad)}" fill="${wash}" opacity="0.75"/>` +
    `<clipPath id="${id}"><path d="M${pt(add(c, [-rad * 0.1, -rad]))} A${f(rad)} ${f(rad)} 0 0 1 ${pt(add(c, [rad * 0.2, rad]))} A${f(rad * 0.9)} ${f(rad * 0.9)} 0 0 0 ${pt(add(c, [-rad * 0.1, -rad]))}Z"/></clipPath>` +
    `<g clip-path="url(#${id})"><path d="${hatch}" stroke="${ink.fine}" class="fn" stroke-width="0.35"/></g>` +
    `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(rad)}" fill="none" stroke="${ink.line}" class="ln" stroke-width="0.85"/>`;
}

/// MTWABP In's sprig: a curving stem, leaves set alternately, and three
/// berries at its head. Drawn in a 120 × 160 box.
export function sprig(seed = 7, { leaves = 7 } = {}) {
  const r = rng(seed);
  const p0 = [62, 156], p1 = [54, 112], p2 = [70, 64], p3 = [58, 22];
  let out = stem(p0, p1, p2, p3, { w0: 3.2, w1: 1.1 });
  for (let i = 0; i < leaves; i++) {
    const t = 0.16 + (i / leaves) * 0.72;
    const { p, ang } = bez(p0, p1, p2, p3, t);
    const s = i % 2 ? 1 : -1;
    const a = ang + s * (0.95 - t * 0.35) + (r() - 0.5) * 0.2;
    const len = 34 - t * 16 + r() * 4;
    const greens = ['#7FA05A', '#8DAA62', '#6E9450', '#93A85C'];
    out += leaf(p, a, len, len * 0.36, { wash: greens[i % 4], bend: s * 0.1, veins: 5, r, shade: s > 0 ? 1 : 0.6 });
  }
  const head = bez(p0, p1, p2, p3, 1).p;
  out += stem(head, add(head, [-4, -4]), add(head, [-10, -6]), add(head, [-14, -4]), { w0: 1, w1: 0.6 });
  out += berry(add(head, [-15, -3]), 5.2);
  out += berry(add(head, [-3, -9]), 4.6, { wash: '#C25A40' });
  out += berry(add(head, [6, -2]), 4.2, { wash: '#A8402F' });
  return out;
}

/// Grove's figure: a plant at four stages, seed to sapling, each over its
/// own patch of ground, with roots below as plates show them.
export function seedlings(seed = 11) {
  const r = rng(seed);
  let out = '';
  const ground = (x, w) => {
    let g = `<path d="M${x - w / 2} 150 Q${x} ${147 + r()} ${x + w / 2} 150" stroke="${ink.line}" class="ln" stroke-width="0.8" fill="none"/>`;
    for (let k = -w / 2 + 3; k < w / 2 - 2; k += 3) g += `<path d="M${f(x + k)} 151.5 l2 3" stroke="${ink.fine}" class="fn" stroke-width="0.4"/>`;
    return g;
  };
  const roots = (x, depth) => {
    let p = '';
    for (let k = 0; k < 5; k++) {
      const a = Math.PI / 2 + (r() - 0.5) * 1.2;
      const l = depth * (0.5 + r() * 0.5);
      p += `M${x} 150 q${f(Math.cos(a) * l * 0.5 + (r() - 0.5) * 6)} ${f(l * 0.4)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}`;
    }
    return `<path d="${p}" stroke="${ink.fine}" class="fn" stroke-width="0.6" fill="none"/>`;
  };
  // Fig. 1, the seed.
  out += ground(30, 36) + `<ellipse cx="31" cy="156" rx="6.5" ry="4.5" fill="#B08A52" opacity="0.75"/><ellipse cx="30" cy="155" rx="6.5" ry="4.5" fill="none" stroke="${ink.line}" class="ln" stroke-width="0.8"/><path d="M26 154 q4 -2 8 0" stroke="${ink.fine}" class="fn" stroke-width="0.4" fill="none"/>`;
  // Fig. 2, the sprout: two seed leaves.
  out += ground(95, 40) + roots(95, 16) + stem([95, 150], [95, 140], [94, 132], [95, 124], { w0: 1.8, w1: 1.2 });
  out += leaf([95, 124], -2.5, 13, 5.5, { r, veins: 2 }) + leaf([95, 124], -0.6, 13, 5.5, { r, veins: 2, shade: 0.5 });
  // Fig. 3, a young plant.
  out += ground(165, 44) + roots(165, 24) + stem([165, 150], [163, 125], [167, 105], [165, 84], { w0: 2.4, w1: 1.1 });
  for (const [t, s, l] of [[0.3, -1, 22], [0.55, 1, 20], [0.78, -1, 16], [0.95, 1, 12]]) {
    const { p, ang } = bez([165, 150], [163, 125], [167, 105], [165, 84], t);
    out += leaf(p, ang + s * 0.9, l, l * 0.38, { r, veins: 4, shade: s > 0 ? 1 : 0.6 });
  }
  // Fig. 4, a sapling with a small crown.
  out += ground(250, 56) + roots(250, 32) + stem([250, 150], [246, 110], [254, 80], [250, 40], { w0: 4.2, w1: 1.2, wash: '#7A5A3A' });
  for (let i = 0; i < 11; i++) {
    const t = 0.32 + (i / 11) * 0.66;
    const { p, ang } = bez([250, 150], [246, 110], [254, 80], [250, 40], t);
    const s = i % 2 ? 1 : -1;
    const l = 26 - t * 12 + r() * 4;
    out += leaf(p, ang + s * (1.05 - t * 0.4), l, l * 0.4, { r, veins: 4, wash: ['#6E9450', '#7FA05A', '#5F8A47'][i % 3], shade: s > 0 ? 1 : 0.6 });
  }
  return out;
}

/// Kolahal's figure: a fern frond, its tip still unfurling, with a crozier
/// beside it, as a plate shows a plant's parts.
export function fern(seed = 5) {
  const r = rng(seed);
  const p0 = [70, 158], p1 = [60, 110], p2 = [92, 64], p3 = [120, 26];
  let out = stem(p0, p1, p2, p3, { w0: 2.6, w1: 0.8, wash: '#7D7244' });
  const N = 18;
  for (let i = 0; i < N; i++) {
    const t = 0.12 + (i / N) * 0.84;
    const { p, ang } = bez(p0, p1, p2, p3, t);
    for (const s of [1, -1]) {
      const l = (30 - t * 22) * (0.9 + r() * 0.2);
      out += leaf(p, ang + s * (1.15 - t * 0.3), l, l * 0.3, { r, veins: 3, wash: ['#6E9450', '#7FA05A'][i % 2], bend: s * 0.08, shade: s > 0 ? 1 : 0.5 });
    }
  }
  // The crozier: a young frond still curled, its spiral drawn twice.
  let spiral = '';
  for (let k = 0; k < 2; k++) {
    let d = '';
    for (let a = 0; a < Math.PI * 4.2; a += 0.15) {
      const rad = 15 - a * 1.05 + k * 1.6;
      if (rad < 1.2) break;
      d += `${d ? 'L' : 'M'}${f(186 + Math.cos(a) * rad)} ${f(70 + Math.sin(a) * rad)}`;
    }
    spiral += `<path d="${d}" stroke="${ink.line}" class="ln" stroke-width="${k ? 0.6 : 1.1}" fill="none"/>`;
  }
  out += stem([178, 160], [176, 130], [196, 110], [200, 72], { w0: 2.4, w1: 2, wash: '#7D7244' });
  out += `<circle cx="187" cy="71" r="14" fill="#8DAA62" opacity="0.55"/>` + spiral;
  return out;
}

/// A small leaf with its midrib, plain enough to read at 16 pixels.
export function iconLeaf({ wash = '#7FA05A', line = ink.line } = {}) {
  return `<path d="M50 88 C28 70 26 34 50 12 C74 34 72 70 50 88Z" fill="${wash}"/>` +
    `<path d="M50 88 C28 70 26 34 50 12 C74 34 72 70 50 88Z" fill="none" stroke="${line}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M50 92 L50 22" stroke="${line}" stroke-width="4.5" stroke-linecap="round"/>` +
    `<path d="M50 62 L36 50 M50 62 L64 50 M50 44 L40 35 M50 44 L60 35" stroke="${line}" stroke-width="3" stroke-linecap="round"/>`;
}
