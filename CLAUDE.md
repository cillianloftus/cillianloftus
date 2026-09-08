# cillianloftus.com

Personal site for Cillian Loftus — architecture portfolio, writing, and CV.
Replaces an older static HTML site. Also serves as a portfolio piece for
web development work, so code quality, semantics, and performance matter
as much as the visual result.

## Stack

- **Astro** — static output, no SSR. Zero JS by default; React islands only
  where interactivity is genuinely required.
- **TypeScript** — used in `src/lib/` and anywhere touching Sanity data.
  Plain JS is acceptable in markup-heavy `.astro` frontmatter.
- **Sanity** — headless CMS. Content is fetched at build time via GROQ.
  Studio is a separate deployment.
- **CSS** — plain modern CSS. Scoped `<style>` blocks per component,
  global tokens in `src/styles/global.css`. No Tailwind, no CSS-in-JS.
- **Cloudflare Pages** — hosting for both site and studio. Deploys on push
  to `main`. Domain registered at Hostinger, nameservers moved to Cloudflare.
- **Python** — used only for local image processing scripts (PyMuPDF).
  Not part of the site build.

## Repo layout

```
site/                        → cillianloftus.com
  src/
    pages/                   file-based routing
    layouts/                 Base.astro, Writing.astro
    components/              .astro, plus Lightbox.tsx (React island)
    lib/                     sanity.ts, image.ts, types.ts
    styles/global.css
  public/
studio/                      → studio.cillianloftus.com
  schemas/
  sanity.config.ts
scripts/
  pdf_to_png.py              batch PDF → PNG conversion
```

## Content model

### `project`
- title, year, location, type
- description (rich text)
- drawings — array of `drawing` objects
- private (boolean) — routes to `/private/[slug]`, excluded from public lists
- featured (boolean) — surfaces on home page

### `drawing` (object, nested in project)
- image, caption
- **projection** — required, multi-select: plan, section, elevation,
  axonometric, perspective, detail
- **medium** — optional, multi-select: sketch, cad, render, model-photo, collage
- fullWidth (boolean) — spans the grid

Two independent axes. A section perspective is both a section and a
perspective; a plan sketch is a plan with sketch medium. Do not merge these
into a single list. Store slugs as values, display human labels.

### `writing`
- title, slug, date, category (article | poetry | dissertation)
- body (rich text), optional PDF attachment
- draft (boolean) — excluded from build

Articles and poetry share this type. Do not split into separate types.

### `siteSettings`
Bio, contact details, CV file. Nothing in this category should be hardcoded.

## URL structure

Settled — changing these later means redirects.

```
/                            home
/cv
/portfolio                   project index
/portfolio/[slug]            project page
/drawings                    filterable index of all drawings
/writing                     writing index
/writing/[slug]              includes the dissertation (how-much-does-a-cloud-weigh)
/colophon
/private/[slug]              password-protected work
/404
/rss.xml
```

301 redirects needed from the old site: `/aboutme`, `/portfolio`.

## Key features

**Drawings index (`/drawings`)** — every drawing across all projects, filtered
by pill toggles. Three rows: projection, medium, year. Projection and medium
are AND within their own row and across rows — a drawing must match every
selected pill (e.g. Plan + Axonometric shows only drawings tagged as both,
not either). Year is the one OR row: selecting 2026 and 2024 shows drawings
from either year, since a drawing only ever has one. Year is still ANDed
against whatever's selected in the other two rows. Pill counts reflect this
per-row combinator: an AND-row pill shows how many of the currently-visible
drawings also carry that tag (so it reads 0, and disables, once it can't
narrow further); an OR-row pill shows its own count under the other rows'
current constraints, ignoring its own row's selection (otherwise every
not-yet-selected year would misleadingly read 0 the moment one year is
picked). No "All" pill — empty selection means everything. Filter state
lives in the URL query string so it's linkable and back-button works. All
drawings render at build time; filtering is show/hide via CSS class.

**Lightbox** — the one React island. Fits drawing to screen on open, then uses
native browser pinch-zoom via `touch-action` rather than hand-rolled JS zoom.
Requests a ~2000px asset from Sanity's CDN on open (not the grid thumbnail).
Swipe between drawings in a project, swipe down or tap outside to dismiss.
Caption below the image, not overlaid.

**View Transitions** — enabled. Project thumbnails should morph into the full
project page. High priority; this is the main visual flourish on the site.

**Protected pages** — Cloudflare Access rule on `/private/*`, or a shared
password via a Pages Function. Never client-side password checks.

## Conventions

- Mobile-first CSS. `clamp()` for type scale, `auto-fill` grids over media
  queries where possible, container queries where a component needs its own
  width.
- Touch targets minimum 44px — applies especially to the filter pills.
- Always build `srcset` from Sanity CDN params. Never serve full-resolution
  assets to phones.
- Wide sheets (A1 sections) letterbox at natural aspect ratio in the grid.
  Legible-as-composition on mobile is the bar, not full detail.
- Focal point set per image in the Studio so thumbnails crop sensibly.
- `prefers-reduced-motion` and dark mode respected via media queries and
  custom properties.
- Print stylesheet for `/cv`.
- Open Graph images generated per page at build time from the first drawing.

## Deliberately ruled out

- **All-React build** — defeats the purpose of Astro. Islands only.
- **Scroll-driven animation** — ages badly, competes with the drawings.
- **Newsletter** — RSS covers it.
- **Tags, year archives, separate blog** — not enough content to be
  anything but empty scaffolding.
- **Client-side password checks** — not real protection.
- **SVG conversion of drawings** — many contain embedded renders and
  textures. Rasterise to PNG; let Sanity's CDN handle AVIF/WebP.
- **Pyodide / PyScript** — no Python in the browser.

## Not yet decided

- Whether protected pages need per-person access (Cloudflare Access) or a
  single shared section password.
- Exact DPI for PDF → PNG conversion. Test one linework sheet and one
  render-heavy sheet before batch converting. Cap long edge at ~5000px.
- CV as structured data rendering to both web and PDF, versus simply
  uploading a PDF. Start with the PDF.
- Pagefind search — worth adding once the writing archive has volume.

## Gotchas

- Publishing in Sanity does **not** trigger a rebuild. A webhook from Sanity
  to Cloudflare Pages is required.
- The dev server queries Sanity at startup. Restart it after publishing new
  content, or wire up live preview.
- Sanity's image pipeline only handles raster images. PDFs upload as generic
  files with no transforms.

## Current status

Site shell and first templates are built: home, CV, colophon, 404, and all
four main nav destinations (`/portfolio`, `/drawings`, `/writing`) render
against hand-written placeholder data in `site/src/lib/placeholder-data.ts`,
typed by `site/src/lib/types.ts`.

The Sanity schema and Studio are scaffolded (`studio/schemas/`: `project`,
`drawing` (object), `writing`, `siteSettings`), and `site/src/lib/sanity.ts`
has the client, GROQ queries, an image URL builder, and a portable-text-to-HTML
helper ready to go. Neither is wired up to a live project yet — that needs a
real Sanity project ID, which requires logging into a Sanity account
(`npx sanity login` from `studio/`, or create one at sanity.io/manage), then
setting `SANITY_PROJECT_ID` in both `site/.env` and `studio/.env` (see each
directory's `.env.example`).

Next once that's connected: swap the placeholder-data imports in the
portfolio/drawings/writing pages for the real `sanity.ts` queries, migrate
the real content over from placeholder-data.ts, and deploy the Studio
(`npm run deploy` from `studio/`) to studio.cillianloftus.com.
