// The dunes of the pause page, worked out for each pixel on the graphics card: a long dune crest after
// woodblock prints, with ranges of dunes and far mesas behind it. It is the "dunes" scene of Kolahal, the
// app, without what belongs to the app. dunes.ts runs it, and scenes.ts lays the caravan over its picture.
//
// Flat shapes with one soft gradient each. Every dune has a long side against the wind and a short one
// behind it; one is in the light and the other in the shade, and which is which depends on where the sun
// or the moon stands. The scene is measured by the screen's height, so a wider screen shows more of the
// desert.

precision highp float;

// The whole scene's size in pixels, and how many of its rows of pixels this picture has, from the top: the
// scene's foot lies under the page's veil and isn't drawn.
uniform vec2 resolution;
uniform float drawn;
// 1 in the dark look, when the moon and the stars are out.
uniform float dark;
// Where the sun or the moon is on its arc, from the left horizon (0) to the right one (1).
uniform float arc;
// How far along each of the three rows of dunes this visit looks, in dunes.
uniform vec3 shift;
// How full the scene's breath is, 0 to 1: the light swells with it.
uniform float breath;
// The hour's colours: the sky from overhead to the horizon, the haze, sand in the light and in the shade
// (far off and nearby), the light around the sun or the moon, and its disc.
uniform vec3 sky;
uniform vec3 mid;
uniform vec3 horizonSky;
uniform vec3 haze;
uniform vec3 litFar;
uniform vec3 litNear;
uniform vec3 shadeFar;
uniform vec3 shadeNear;
uniform vec3 glow;
uniform vec3 disc;

// Where the plain begins, as a part of the height.
const float PLAIN = 0.392;

// The top of the long dune: across from the middle, in heights, and down from the top. scenes.ts walks the
// caravan up the same outline, so its numbers there have to match the ones here.
const vec2 PEAK = vec2(0.075, 0.318);

// A number from 0 to 1 that looks random for each n or p (Dave Hoskins' hashes without sine).
float hash(float n) {
    float p = fract(n * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash2(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}

// Smooth noise along a line, 0 to 1.
float noise1(float x) {
    float at = floor(x);
    float f = fract(x);
    return mix(hash(at), hash(at + 1.0), f * f * (3.0 - 2.0 * f));
}

// A dune's outline from its foot against the wind (0) over its top (at) to its foot behind it (1), 0 to 1:
// long and round on the way up, short and hollow on the way down.
float profile(float t, float at) {
    float a = t / at;
    float b = (t - at) / (1.0 - at);
    return t < at ? mix(a * a * (3.0 - 2.0 * a), a, 0.25) : (1.0 - b) * (1.0 - b);
}

// The way up a dune against the wind, from its foot (0) to its top (1): long and round.
float climb(float a) {
    return mix(a * a * (3.0 - 2.0 * a), a, 0.25);
}

// The line from a dune's top towards the viewer, which parts its two sides: how far it has swung at depth v,
// whose square root is root. n is the line's number.
float swing(float v, float root, float n) {
    float turn = 6.2832 * hash(n + 5.0);
    return sin(root * (3.2 + 2.0 * hash(n + 2.0)) + turn) * (0.35 + v) - sin(turn) * 0.35;
}

// Where a dune's top is between its two hollows (0 to 1), for dune number id of a row.
float topAt(float id, float seed) {
    return 0.52 + 0.22 * hash(id * 7.0 + seed);
}

// Where the top line of a row of dunes is at x = qx. base is the row's top line and tall its height, in parts
// of the screen's height; width is one dune's. Returns the line, the dune's number, where this place is
// between the dune's two hollows (0 to 1) and where the dune's top is.
vec4 rowTop(float qx, float n, float base, float tall, float width) {
    float seed = n * 17.0;
    float x = qx / width + 3.93 * n + 40.0 + (n < 0.5 ? shift.x : n < 1.5 ? shift.y : shift.z);
    float id = floor(x);
    float t = x - id;
    float at = topAt(id, seed);
    float high = (0.45 + 0.55 * hash(id * 3.0 + seed + 11.0)) * profile(t, at);
    return vec4(base - tall * high - 0.35 * tall * (noise1(x * 0.37 + n) - 0.5), id, t, at);
}

// The sand of a row of dunes whose top line is top (from rowTop). reach is how far down the row goes before
// it has faded into the haze; near is how much of the near colours it has, and ripples how clear the lines in
// its sand are. from is where the light is (1 from the right, -1 from the left).
vec3 rowSand(vec3 colour, vec2 q, float y, vec4 top, float n, float width, float reach, float near,
    float ripples, float from, float px, vec3 lit, vec3 shade, vec3 mist, vec4 warm, vec4 under) {
    float topLine = top.x;
    float cover = clamp((y - topLine) / px + 0.5, 0.0, 1.0);
    if (cover > 0.0) {
        float seed = n * 17.0;
        float id = top.y;
        float t = top.z;
        float at = top.w;
        float v = (y - topLine) / reach;
        float root = sqrt(max(v, 0.0));
        // The crest's line swings as it comes towards the viewer, and so do the lines in the two hollows.
        float crest = at + (0.10 + 0.12 * near) * swing(v, root, id + n * 31.0);
        float left = 0.12 * swing(v, root, id + n * 31.0 + 0.5);
        float right = 1.0 + 0.12 * swing(v, root, id + 1.0 + n * 31.0 + 0.5);
        // Which side this is, and how far from its hollow (0) towards its crest (1). Past a hollow's line the
        // place belongs to the next dune's side.
        float lee;
        float toCrest;
        if (t < left) {
            float before = topAt(id - 1.0, seed) + (0.10 + 0.12 * near) * swing(v, root, id - 1.0 + n * 31.0) - 1.0;
            lee = 1.0;
            toCrest = (left - t) / max(left - before, 0.001);
        } else if (t < crest) {
            lee = 0.0;
            toCrest = (t - left) / max(crest - left, 0.001);
        } else if (t < right) {
            lee = 1.0;
            toCrest = (right - t) / max(right - crest, 0.001);
        } else {
            float after = 1.0 + topAt(id + 1.0, seed) + (0.10 + 0.12 * near) * swing(v, root, id + 1.0 + n * 31.0);
            lee = 0.0;
            toCrest = (t - right) / max(after - right, 0.001);
        }
        toCrest = clamp(toCrest, 0.0, 1.0);
        // Each side is at its own colour at the crest; the two meet in the hollow and grow alike down the dune.
        float apart = toCrest * toCrest * (1.0 - smoothstep(0.30, 0.95, v));
        float bright = 0.5 + mix(-0.5, 0.5, lee) * from * (0.22 + 0.78 * apart) * (lee > 0.5 ? smoothstep(0.0, 0.05, toCrest) : 1.0);
        // The edge of the crest's line, one pixel soft.
        float edge = abs(t - crest) * width / px;
        if (edge < 1.5) bright = mix(0.5 + 0.5 * from * (t < crest ? -1.0 : 1.0), bright, 0.5 + edge / 3.0);
        if (ripples > 0.0 && v > 0.03 && v < 0.95) {
            // Lines across the wind on the side against it, near each other far off and wider apart nearby.
            float rows = 40.0 * sqrt(v + 0.02) + 1.1 * sin(q.x * 21.0 + 6.0 * v) + 0.5 * sin(q.x * 53.0 - 9.0 * v);
            float line = 0.4 - smoothstep(0.0, 0.20, abs(fract(rows) - 0.35)) + 0.6 * smoothstep(0.0, 0.30, abs(fract(rows + 0.32) - 0.35));
            float where = smoothstep(-0.6, 0.8, sin(q.x * 11.0 + 2.2 * sin(v * 9.0 + q.x * 6.0)));
            bright += line * where * ripples * smoothstep(0.03, 0.14, v) * (1.0 - smoothstep(0.55, 0.95, v)) * (1.0 - 0.8 * lee);
        }
        vec3 sand = mix(mix(shade, lit, clamp(bright, 0.0, 1.15)), mist, mix(0.60, 0.34, near) * smoothstep(0.0, 1.0, v) + 0.22 * (1.0 - near));
        // A far row runs out into what is behind it. The nearest one ends in the ground's own colour (under).
        float gone = smoothstep(0.60, 1.0, v);
        sand = mix(mix(sand, warm.rgb, 0.35 * warm.a * (1.0 - near)), under.rgb, under.a * gone);
        colour = mix(colour, sand, cover * (1.0 - gone * (1.0 - under.a)));
    }
    return colour;
}

// One row of dunes far off, between y = base - tall and base + reach.
vec3 row(vec3 colour, vec2 q, float y, float n, float base, float tall, float width, float reach, float near,
    float from, float px, vec3 lit, vec3 shade, vec4 warm) {
    if (y > base - tall - 0.02 && y < base + reach) {
        colour = rowSand(colour, q, y, rowTop(q.x, n, base, tall, width), n, width, reach, near, 0.0, from, px, lit, shade, haze, warm, vec4(0.0));
    }
    return colour;
}

// Mist in a long bar around y = at, from one x to another, with soft ends: where it is, from 0 to 1.
float bar(vec2 q, float at, float thick, float from, float to) {
    float dy = (q.y - at) / thick;
    float sum = 0.0;
    if (abs(dy) < 1.6) {
        float ends = min(q.x - from, to - q.x) / (thick * 6.0);
        sum = exp(-dy * dy * 3.5) * smoothstep(0.0, 1.0, ends - dy * dy);
    }
    return sum;
}

void main() {
    vec2 res = resolution;
    // Pixels from the top left, as the scene is measured.
    vec2 xy = vec2(gl_FragCoord.x, drawn - gl_FragCoord.y);
    float y = xy.y / res.y;

    // The scene is measured in heights from the middle of the screen, so a wider screen shows more of it.
    float small = min(res.x, res.y);
    float wide = res.x / res.y;
    vec2 q = vec2((xy.x - 0.5 * res.x) / res.y, y);
    float px = 1.0 / res.y;

    // The sun by day and the moon in the dark, on an arc from left to right.
    bool moon = dark > 0.5;
    float up = sin(3.1416 * clamp(arc, 0.0, 1.0));
    float low = moon ? 0.0 : 1.0 - smoothstep(0.25, 0.75, up);
    float r = 0.021 * mix(1.0, 1.28, low) * mix(1.0, 1.25, smoothstep(0.6, 1.6, wide));
    float span = min(0.36 * wide, 0.46);
    vec2 sunAt = vec2(mix(-span, span, arc), mix(0.365, 0.13, pow(up, 0.8)));
    float there = smoothstep(0.0, 0.10, up);
    vec2 off = q - sunAt;
    float far = length(off);
    float halo = max(0.0, 1.0 - far / (4.5 * r));
    float shine = 0.0;
    if (y < 0.56) {
        float around = exp(-(off.x * off.x / 6.76 + off.y * off.y) / 0.0110);
        float peak = moon ? 0.16 : mix(0.40, 0.62, low);
        shine = clamp((peak * around + 0.35 * halo * halo * (moon ? 0.6 : 1.0)) * there * mix(1.0, 0.45, dark), 0.0, 1.0);
        // The light around the sun or the moon spreads on the breath in.
        shine *= mix(0.85, 1.25, breath);
    }

    // The scene is worked out from the front: what a nearer dune hides is not drawn. First the nearest range's
    // top line, then the long dune's outline. It climbs from the left to its top and falls away behind it.
    bool nearHere = y > 0.422 && y < 0.832;
    vec4 nearTop = vec4(0.0);
    bool behind = false;
    if (nearHere) {
        nearTop = rowTop(q.x, 2.0, 0.532, 0.090, 0.740);
        behind = (y - nearTop.x) / px + 0.5 >= 1.0;
    }
    float dx = q.x - PEAK.x;
    float side = dx < 0.0 ? dx / 0.62 : dx / 0.33;
    float outline = PEAK.y + (dx < 0.0 ? 0.150 * (1.0 - climb(1.0 + max(side, -1.0))) : 0.132 * (1.0 - (1.0 - min(side, 1.0)) * (1.0 - min(side, 1.0))));
    float cover = clamp((y - outline) * res.y + 0.5, 0.0, 1.0);
    float shown = cover * (1.0 - smoothstep(0.78, 1.0, abs(side)));
    // Open: neither of the two hides this place, so the sky or the far dunes show here.
    bool open = !behind && shown < 1.0;

    // The light comes from the sun's or the moon's side: 1 from the right of a place, -1 from the left. On the
    // breath in, the two sides of every dune draw further apart.
    float strength = (moon ? 0.75 : 1.0) * there * mix(0.84, 1.08, breath);
    float from = (sunAt.x - q.x) / (abs(sunAt.x - q.x) + 0.06) * strength;
    vec4 warm = vec4(glow, shine);
    vec3 ground = mix(haze, mix(shadeNear, litNear, 0.6), clamp((y - PLAIN) / 0.22, 0.0, 1.0) * 0.55);
    vec3 colour = haze;

    if (open) {
        // The sky: three colours from the top to the plain, and a deeper band along the very top, as prints have.
        float s = y / PLAIN;
        if (y < PLAIN + 0.002) {
            colour = s < 0.55 ? mix(sky, mid, s / 0.55) : mix(mid, horizonSky, clamp((s - 0.55) / 0.45, 0.0, 1.0));
            colour = mix(colour, sky * mix(0.84, 0.66, dark), 0.42 * (1.0 - smoothstep(0.0, 0.16, y)) * (1.0 - smoothstep(0.0, 0.16, y)));
        }
        if (y < 0.56) colour = mix(colour, glow, shine);
        if (moon && y < PLAIN) {
            // Small stars, fewer near the moon and the horizon, and other ones each visit.
            vec2 cellAt = xy / (small * 0.052);
            vec2 id = floor(cellAt) + floor(shift.xy);
            float bright = hash2(id);
            vec2 star = fract(cellAt) - (0.2 + 0.6 * vec2(hash2(id + 7.1), hash2(id + 3.7)));
            float dot1 = 1.0 - smoothstep(0.012, 0.036 + 0.02 * bright, length(star));
            colour += disc * dot1 * step(0.62, bright) * 0.45 * (1.0 - smoothstep(0.5, 1.0, y / PLAIN)) * (1.0 - halo);
        }
        float face = clamp((r - far) * res.y + 0.5, 0.0, 1.0) * there;
        // The moon is a sickle: a part of its disc is the sky's.
        if (moon) face *= 1.0 - clamp((r * 0.92 - length(off - vec2(r * 0.42, -r * 0.16))) * res.y + 0.5, 0.0, 1.0);
        colour = mix(colour, disc, face * mix(1.0, moon ? 0.86 : 0.66, dark));

        // Far off, mesas: flat-topped rock, pale, that only a wide screen has room for.
        if (y > 0.300 && y < PLAIN + 0.004) {
            float top = PLAIN;
            // Each: where it is, half its width at the top, how high.
            vec3 rock1 = vec3(-0.640, 0.105, 0.052);
            vec3 rock2 = vec3(-0.418, 0.020, 0.064);
            vec3 rock3 = vec3(0.705, 0.070, 0.040);
            vec3 rock4 = vec3(1.020, 0.150, 0.058);
            for (int i = 0; i < 4; i++) {
                vec3 rock = i == 0 ? rock1 : i == 1 ? rock2 : i == 2 ? rock3 : rock4;
                float d = abs(q.x - rock.x) - rock.y;
                // A wall that leans a little, with an uneven top, and a slope of fallen rock at its foot.
                float wall = 1.0 - smoothstep(0.0, 0.10, d / rock.z);
                float foot = 1.0 - clamp(d / (rock.z * 2.4), 0.0, 1.0);
                float high = rock.z * max(wall * (0.94 + 0.06 * noise1(q.x * 34.0 + rock.x * 9.0)), 0.36 * foot * foot);
                top = min(top, PLAIN - high);
            }
            float rockHere = clamp((y - top) * res.y + 0.5, 0.0, 1.0);
            if (rockHere > 0.0) {
                float deep = clamp((y - top) / 0.06, 0.0, 1.0);
                vec3 stone = mix(mix(horizonSky, shadeFar, 0.80), haze, 0.12 + 0.62 * deep);
                colour = mix(colour, mix(stone, glow, shine * 0.5), rockHere);
            }
        }

        // The plain.
        if (y > PLAIN - 0.004) colour = mix(colour, ground, clamp((y - PLAIN) * res.y + 0.5, 0.0, 1.0));

        // Two ranges of dunes far off, each with bars of mist before it.
        if (y > 0.34 && y < 0.56) {
            colour = row(colour, q, y, 0.0, 0.401, 0.026, 0.150, 0.045, 0.12, from, px,
                mix(litFar, litNear, 0.12), mix(shadeFar, shadeNear, 0.12), warm);
            float mist = bar(q, 0.4110, 0.0075, -0.56, -0.02) + bar(q, 0.4150, 0.0065, 0.18, 0.80);
            colour = mix(colour, mix(haze, glow, 0.25 * shine), 0.42 * clamp(mist, 0.0, 1.0));
            colour = row(colour, q, y, 1.0, 0.434, 0.056, 0.300, 0.110, 0.45, from, px,
                mix(litFar, litNear, 0.45), mix(shadeFar, shadeNear, 0.45), warm);
            mist = bar(q, 0.4580, 0.0100, -0.06, 0.66) + bar(q, 0.4500, 0.0085, -0.98, -0.32);
            colour = mix(colour, mix(haze, glow, 0.25 * shine), 0.40 * clamp(mist, 0.0, 1.0));
        }
    }

    if (!behind) {
        // The long dune: its crest comes down from the top towards the viewer in a long bend.
        float vh = (y - PEAK.y) / 0.30;
        if (shown > 0.002) {
            // The crest: first away from the wind, then back across.
            float crest = PEAK.x - 0.20 * vh + 0.050 * sin(5.6 * sqrt(max(vh, 0.0))) * (0.3 + vh);
            float e = q.x - crest;
            float lee = smoothstep(-1.5 * px, 1.5 * px, e);
            float toSun = (sunAt.x - PEAK.x) / (abs(sunAt.x - PEAK.x) + 0.05) * strength;
            float light = clamp(0.5 + mix(-0.56, 0.56, lee) * toSun, 0.0, 1.0);
            float apart = exp(-abs(e) * mix(9.0, 4.0, clamp(vh, 0.0, 1.0))) * (1.0 - smoothstep(0.50, 1.0, vh));
            float bright = mix(0.50, light, 0.30 + 0.70 * apart);
            // Ripples against the wind: lines across it, near each other far off and wider apart nearby. Behind the
            // crest the sand has slid, and is smooth.
            float rows = 44.0 * sqrt(vh + 0.02) + 1.1 * sin(q.x * 21.0 + 6.0 * vh) + 0.5 * sin(q.x * 53.0 - 9.0 * vh) + 4.0 * exp(-abs(e) * 16.0);
            float line = 0.4 - smoothstep(0.0, 0.20, abs(fract(rows) - 0.35)) + 0.6 * smoothstep(0.0, 0.30, abs(fract(rows + 0.32) - 0.35));
            float where = smoothstep(-0.6, 0.8, sin(q.x * 11.0 + 2.2 * sin(vh * 9.0 + q.x * 6.0)));
            bright += line * where * 0.045 * smoothstep(0.04, 0.16, vh) * (1.0 - smoothstep(0.55, 0.95, vh)) * (1.0 - 0.8 * lee);
            vec3 sand = mix(mix(mix(shadeFar, shadeNear, 0.7), mix(litFar, litNear, 0.7), clamp(bright, 0.0, 1.15)), haze, 0.62 * smoothstep(0.0, 0.9, vh));
            colour = mix(colour, sand, shown);
        }
    }

    // The nearest range, before the long dune's foot. It ends in the ground's own colour.
    if (nearHere) {
        colour = rowSand(colour, q, y, nearTop, 2.0, 0.740, 0.300, 0.90, 0.07, from, px,
            mix(litFar, litNear, 0.92), mix(shadeFar, shadeNear, 0.92), haze, warm, vec4(ground, 1.0));
    }

    // Dither, so the long gradients have no bands.
    colour += (hash2(xy) - 0.5) / 255.0;

    gl_FragColor = vec4(colour, 1.0);
}
