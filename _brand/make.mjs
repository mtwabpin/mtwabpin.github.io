// Draws MTWABP In's art into images/: the emblem, each app's plate figure,
// the icon tile and the favicon, as SVG, and _brand/share.html, which
// make.sh turns into the share picture. Run make.sh rather than this.
import fs from 'fs';
import { sprig, seedlings, fern, iconLeaf } from './plants.mjs';

const images = new URL('../images/', import.meta.url);
const write = (name, body) => fs.writeFileSync(new URL(name, images), body);

// Lines in sepia on cream, and pale on the dark page; the washes stay.
const inkStyle = '<style>.ln{stroke:#3B2A1E}.fn{stroke:#5A4636}@media (prefers-color-scheme:dark){.ln{stroke:#E6D9BF}.fn{stroke:#BFAE92}}</style>';
const svg = (viewBox, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${extra}>${inkStyle}${body}</svg>\n`;

// The emblem: the sprig in a double oval.
const oval = '<ellipse cx="60" cy="79" rx="66" ry="86" fill="none" class="ln" stroke="#3B2A1E" stroke-width="1.2"/><ellipse cx="60" cy="79" rx="62" ry="82" fill="none" class="fn" stroke="#5A4636" stroke-width=".5"/>';
write('mtwabp-emblem.svg', svg('-10 -12 140 182', oval + sprig()));

// Plate I, Grove: from seed to sapling. Plate II, Kolahal: a fern.
write('plate-grove.svg', svg('0 0 300 180', seedlings()));
write('plate-kolahal.svg', svg('0 0 220 175', fern()));

// The icon: the sprig on cream in a ruled frame, in fixed colours, as
// it sits on a home screen whatever the page's theme.
const fixed = (s) => s.replaceAll(' class="ln"', '').replaceAll(' class="fn"', '');
write('mtwabp-icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#F2EAD8"/><rect x="34" y="34" width="444" height="444" rx="86" fill="none" stroke="#8C7458" stroke-width="6"/><rect x="50" y="50" width="412" height="412" rx="74" fill="none" stroke="#8C7458" stroke-width="2.5"/><g transform="translate(118 64) scale(2.3)">${fixed(sprig(7, { leaves: 5 }))}</g></svg>\n`);

// The favicon: one plain leaf, which still reads at 16 pixels.
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#F2EAD8"/><g transform="translate(56 56) scale(4)">${iconLeaf()}</g></svg>\n`);

// The share picture, a plate of 1200 × 630, for make.sh to photograph.
fs.writeFileSync(new URL('share.html', import.meta.url), `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "IM Fell SC"; src: url("../fonts/IMFellEnglishSC.woff2") format("woff2"); }
@font-face { font-family: "IM Fell"; src: url("../fonts/IMFellEnglish-Italic.woff2") format("woff2"); font-style: italic; }
body { margin: 0; width: 1200px; height: 630px; overflow: hidden; color: #2E2219; background: #F2EAD8 radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(140, 116, 88, .22)); }
.og { position: absolute; inset: 22px; border: 4px double #8C7458; }
.em { position: absolute; left: 76px; top: 64px; width: 170px; }
.t { position: absolute; left: 290px; top: 120px; font: 118px/1 "IM Fell SC", serif; letter-spacing: .06em; }
.m { position: absolute; left: 296px; top: 262px; font: italic 50px "IM Fell", serif; color: #8E3B2A; }
.r { position: absolute; left: 296px; right: 70px; top: 352px; border-top: 1px solid #8C7458; }
.apps { position: absolute; left: 296px; top: 392px; display: flex; gap: 48px; align-items: center; font: 40px "IM Fell SC", serif; letter-spacing: .05em; }
.apps span { display: flex; gap: 16px; align-items: center; } .apps img { width: 64px; border-radius: 14px; }
.no { position: absolute; right: 40px; top: 26px; font: italic 30px "IM Fell", serif; color: #6E5B48; }
</style></head><body><div class="og"><span class="no">Plate the first.</span><img class="em" src="../images/mtwabp-emblem.svg" alt=""><div class="t">MTWABP In</div><div class="m">Make the world a better place</div><div class="r"></div><div class="apps"><span><img src="../grove/images/grove-icon.png" alt="">Grove</span><span><img src="../images/kolahal-icon.svg" alt="">Kolahal</span></div></div></body></html>
`);
console.log('drew the emblem, both plates, the icon, the favicon and share.html');
