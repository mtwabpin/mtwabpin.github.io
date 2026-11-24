# mtwabpin.github.io

MTWABP In's site: the home page, Grove's pages, notes, and the quiet pages for LeechBlock. Built with [Astro](https://astro.build), published to GitHub Pages, readable offline after the first visit.

## Run

- Needs Node.js 22.12+ and pnpm (version pinned in `package.json`). On NixOS without pnpm, prefix commands with `nix shell nixpkgs#pnpm -c`.
- `pnpm install`: install dependencies.
- `pnpm dev`: http://localhost:4321, drafts included.
- `pnpm build`: type-check and build to `dist/`.
- `pnpm preview`: serve `dist/` (the offline service worker only runs in a build).
- Pushing to `main` deploys through `.github/workflows/deploy.yml` (Settings → Pages → Source: GitHub Actions).

## Where things are

- `src/pages/index.astro`: the home page, a botanical plate with a numbered plate for each app and the latest notes.
- `src/styles/paper.css`: the paper, ink and type shared by the home page and the notes; `home.css` and `notes.css` for each.
- `public/grove/`: Grove's pages and guide, served as they are.
- `public/images/`, `public/fonts/`: the art and type; `_brand/` draws the art (see its README) and isn't published.
- `/kolahal/` is Kolahal's own site, published from its own repo.

## Notes

- `src/content/posts/` → `/posts/<name>/`: newest first, in the RSS feed (`/rss.xml`) and on the home page.
- Formats: Markdown (`.md`), MDX (`.mdx`, with components from `src/components/mdx/`) and Org (`.org`).
- Front matter: `title`, `description`, `date`; optionally `updated`, `tags` and `draft: true` (shown by `pnpm dev`, left out of builds). Org uses `#+title:`-style keywords (see `src/lib/org.ts`).
- Code blocks: `` ```js title="garden.js" mark={2,4-5} ``; in Org, `#+begin_src js :title garden.js :mark 2,4-5`.

## Pause and delayed pages

The quiet pages LeechBlock NG can send you to instead of a blocked site, with a scene for the time of day, one quote or reminder, a breathing guide and the sound of rain. The note at `/posts/leechblock/` explains the setup.

- Blocked sites: `https://mtwabpin.github.io/pause/#$U`
- Blocked sites, saying when the block ends (LeechBlock 1.7+): `https://mtwabpin.github.io/pause/lb-custom/?$S&$U`
- Delayed sites (LeechBlock 1.7+): `https://mtwabpin.github.io/delayed/lb-custom/?$S&$U`
- Broad block patterns: add `+mtwabpin.github.io` so these pages aren't blocked too.
- Code: `src/layouts/Quiet.astro`, `src/scripts/pause/`, `src/styles/pause.css`. Quotes, reminders and photos: `src/content/pause.yaml` (photos in `public/pause/`).
- Preview with `/pause/?scene=pond&at=night&look=light&moment=urge-wave` (`scene`: `mountains`, `pond`, `dunes` or `garden`; `at`: `morning`, `day`, `evening` or `night`; `look`: `light` or `dark`; `later=5` shows the three-minute line after 5 seconds).

## Offline

- Each build writes `dist/sw.js`: the site's pages, styles, fonts and small images, plus a hash of their contents. Grove's screenshots are saved as they're viewed, not up front.
- Pages come from the network when it answers within a few seconds, otherwise from the saved copy; the quiet pages open from the saved copy at once.
- `/kolahal/` is left alone, as it's published separately.
