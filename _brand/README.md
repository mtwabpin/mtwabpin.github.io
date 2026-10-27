# MTWABP In's look

The site's own page (`index.html`) is drawn as a botanical plate: cream
paper, engraved plants with a hand-coloured wash, IM Fell and EB Garamond.
Each app's page keeps its own look: Grove's under `grove/`, and Kolahal's
site at `/kolahal/`, published from its own repo.

GitHub Pages leaves this folder out, as its name starts with `_`.

## The art

`plants.mjs` draws the plants in code: fine sepia lines, hatching on the
shaded side, and a wash of colour set a little off the lines. `make.mjs`
uses it to write, into `images/`:

- `mtwabp-emblem.svg`: the sprig in a double oval, at the top of the page;
- `plate-grove.svg`: Plate I, a seed growing to a sapling in four figures;
- `plate-kolahal.svg`: Plate II, a fern frond and a crozier;
- `mtwabp-icon.svg`: the sprig on cream in a ruled frame, the app icon;
- `favicon.svg`: one plain leaf, which still reads at 16 pixels.

The plates' lines turn pale on a dark page by themselves.

`make.sh` runs `make.mjs`, then photographs the icon, the leaf and
`share.html` with headless Chrome: `mtwabp-512.png`, `mtwabp-192.png`,
`mtwabp-180.png`, `favicon-32.png` and `mtwabp-share.jpg` (1200 × 630, the
picture a shared link shows). It needs node, google-chrome and magick.
Each plant has a fixed seed, so it comes out the same each time; change
the seed in `make.mjs` for another drawing of it.

A new app gets a plate of its own: a plant for its figure in
`plants.mjs`, its SVG in `make.mjs`, and a plate on `index.html`
numbered after the last.

## The fonts

IM Fell English (italic and small capitals) and EB Garamond (regular and
italic), under the SIL Open Font License (`fonts/OFL-IMFell.txt`,
`fonts/OFL-EBGaramond.txt`), from github.com/google/fonts. EB Garamond is
fixed at its regular weight, and all four are trimmed to Latin letters and
turned into WOFF2 with fontTools:

    fonttools varLib.instancer 'EBGaramond[wght].ttf' wght=400 -o EBGaramond-400.ttf
    pyftsubset EBGaramond-400.ttf --flavor=woff2 --layout-features='*' \
      --unicodes='U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+20AC,U+2122,U+2190-2193,U+2212' \
      --output-file=EBGaramond-Regular.woff2
