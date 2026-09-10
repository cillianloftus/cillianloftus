# cillianloftus.com

Personal site for Cillian Loftus — architecture portfolio, writing, and CV.
Replaces an older static HTML site. Also serves as a portfolio piece for
web development work, so code quality, semantics, and performance matter
as much as the visual result.

## Stack

- **Astro** — static output, no SSR. Zero JS by default; a React island
  would only be justified where interactivity is genuinely required in a
  way plain JS can't handle well. Nothing on the site has met that bar so
  far — the filter, the masonry layout, and the Lightbox are all plain
  vanilla JS/TS in `<script>` tags, same pattern each time.
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
    components/              .astro, including Lightbox.astro (plain JS,
                             no React — see Key Features)
    lib/                     sanity.ts, image.ts, types.ts
    styles/global.css
  public/
studio/                      → studio.cillianloftus.com
  schemas/
  sanity.config.ts
scripts/
  pdf_to_png.py              PDF sheet → PNG conversion, long edge capped at
                             5000px by default (tested against a linework
                             sheet and a render-heavy sheet: 0.3MB and 2.4MB,
                             both crisp — PNG at this cap is settled, not
                             just a placeholder choice)
```

## Content model

### `project`
- title, year, location, type, role
- **date** — required, used to sort drawings/projects chronologically.
  Separate from `year` (a display label) since exact day doesn't matter.
- description (rich text)
- drawings — array of `projectDrawing` objects
- private (boolean) — routes to `/private/[slug]`, excluded from public lists
- featured (boolean) — surfaces on home page

### `projectDrawing` (object, nested in project)
- image, caption, alt
- **projection** — required, multi-select: plan, section, elevation,
  axonometric, perspective, detail
- **medium** — optional, multi-select: sketch, hand-drawing, cad, render,
  model-photo, collage
- **size** — normal (1 column) | large (2 columns) | full (however many
  columns the current breakpoint shows, so it's always full-width). "Full"
  isn't a fixed span — at the 2-column breakpoint it converges with
  "large" (both span 2); at 1 column everything converges to 1.

Two independent axes (projection, medium). A section perspective is both a
section and a perspective; a plan sketch is a plan with sketch medium. Do
not merge these into a single list. Store slugs as values, display human
labels.

### `drawing` (document, standalone)
Same fields as `projectDrawing` (image, caption, alt, projection, medium,
size), plus its own **date** — required, since it has no parent project
to inherit one from. For drawings that aren't part of any studio project;
the `/drawings` index merges these with project drawings. No project link
in their caption, since there's no project to link to.

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

**Drawings index (`/drawings`)** — every drawing across all projects, plus
standalone drawings not tied to any project, sorted newest-first, filtered
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

**Lightbox** (`Lightbox.astro`) — built in plain JS/TS, not React; the
zoom/pan/swipe state it needs isn't materially different from what the
filter and masonry scripts already handle. One instance per page (rendered
once, moved to a direct child of `<body>` at init so no ancestor's CSS —
transforms, `contain`, the sticky header's `backdrop-filter` — can ever
interfere with its stacking or clipping), triggered by any element carrying
`data-lightbox` — set via `<DrawingImage lightbox />`. The navigable
sequence is whichever `[data-lightbox]` elements are currently visible on
the page (respects the `/drawings` filter's `.is-hidden` state), in DOM
order — on a project page the hero and the rest of the grid share one
sequence.

A single image that slides directionally on navigate, not a crossfade — a
crossfade was tried first (simpler, and it sidestepped an earlier bug
where a 3-slide peek-preview carousel showed inconsistent, distracting
slivers of the neighbor for drawings of very different aspect ratios), but
it read as an unrelated dissolve with no connection to the swipe/click that
caused it. The current version keeps the single-image simplicity — no
neighbor content is ever shown mid-transition — but moves the image itself:
the outgoing drawing translates fully off in the direction it was
swiped/navigated (a full stage-width translate, not the frame's own often-
narrower width, so it's always genuinely clear of the stage) while the
incoming one enters from the opposite side, so the motion reads as "this
drawing moved that way." The image sits in a sized frame (a plain div,
computed to pixel dimensions in JS from the trigger's known
`data-aspect-ratio` and the stage's available space) filled via
`object-fit: contain` — the frame resizes only once, synchronously, while
parked fully off-screen mid-transition (still clipped by the stage's
`overflow: hidden`), so a new drawing's different aspect ratio never
visibly "grows" into place, and the frame's size also never changes as the
image inside it goes from grid-thumbnail-res to full-res: CSS
`aspect-ratio` on the `<img>` itself doesn't work for this, since once any
real image loads its own intrinsic pixel size takes over sizing regardless
of the declared ratio. A touch swipe drags the frame 1:1 with the finger
(no animation, so it tracks exactly) and either continues on into a full
navigation past the swipe threshold or springs back to rest. An
`isAnimating` guard drops clicks/swipes/key presses that land mid-transition
rather than letting them desync the index.

The slide's two legs (exit, then the parked swap, then entry) run through
the Web Animations API (`frame.animate(...)`), not a CSS transition class —
deliberately. Going out-and-back-in needs an instantaneous, untransitioned
jump between the two legs, and a CSS transition animates from whatever the
element's *rendered* state happens to be; whether the browser has actually
painted that jump before the next transition starts isn't guaranteed by a
single `requestAnimationFrame`, and if it hasn't, the browser can coalesce
both writes and animate straight through from the exit's end position to
the entry's end position, skipping the jump — so the new drawing looks like
it's still entering from the side it just exited on instead of the opposite
one. A WAAPI animation's keyframes are explicit values, not "wherever the
element currently is," so there's nothing timing-dependent for the browser
to elide. Verified by slowing the *actual* browser-native animation to 5%
speed via Chrome DevTools Protocol's `Animation.setPlaybackRate` (not a
hand-rolled slow-motion double) and catching it mid-flight, genuinely
approaching from the correct side.

Touch zoom is native browser pinch-zoom, not hand-rolled: the stage uses
`touch-action: pinch-zoom` so a pinch reaches the browser untouched, and
touch handling checks `visualViewport.scale` and bails out (no swipe)
whenever the user is already zoomed in, so panning a zoomed image is never
fought over with swipe-navigation. Mouse users have no pinch gesture at
all, so that alone isn't zoom on desktop — click the image to toggle a
fixed 2.2x zoom, drag to pan while zoomed (clamped so you can't pan the
image out of view entirely); a real drag doesn't also toggle zoom off on
release, only a click with no movement does. Requests a ~2000px asset from
Sanity's CDN on open, not the grid thumbnail — shows the already-loaded
grid image instantly, then swaps to the full-res one once it's preloaded,
so open never shows a blank frame; the same progressive swap happens after
navigating, and the adjacent drawings' full-res assets are quietly
preloaded in the background too, so stepping to them a moment later isn't
waiting on the network.

Swipe horizontally to move between drawings (wraps around at the ends),
swipe down or tap the empty stage area to dismiss; same via the prev/next
buttons, the left/right arrow keys, the space bar (next), Escape, or the
close button. Focus moves into the dialog on open and back to the trigger
on close; Tab cycles only through the dialog's own controls while open.
Caption below the image, not overlaid. Both zoom mechanisms reset (native
via a brief viewport-meta toggle, the desktop one via internal state)
whenever you navigate or close, so the next image never opens still zoomed
in from the last one. Backdrop is black at 80% opacity, not fully solid —
the site stays faintly visible behind it, deliberately.

Grid thumbnails that open the lightbox (`button.drawing-image` in
`DrawingImage.astro`) get a hover/focus state — border switches to
`--color-accent`, image scales to 1.03 — so it's clear before clicking
that a drawing is the interactive kind, not just a static image (the
Portfolio index's project-card thumbnail isn't a lightbox trigger and
keeps its own distinct hover treatment instead).

Verified with real interaction tests (Playwright): open/close via every
path, keyboard nav (arrows, space, Escape), filtered-set navigation,
simulated touch swipe (both live-drag tracking and the completed
navigation), rapid double-click/swipe not desyncing the index, no resize
glitch when the frame settles on a new aspect ratio, desktop click-zoom
and drag-to-pan, the hover state's border/scale change, 44px touch targets
on mobile. Actual on-device pinch-zoom feel is the one thing that needs a
real phone, not just automated checks.

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
- CV as structured data rendering to both web and PDF, versus simply
  uploading a PDF. Start with the PDF.
- Pagefind search — worth adding once the writing archive has volume.

## Gotchas

- Publishing in Sanity does **not** trigger a rebuild. Deploys are manual
  (`npm run build && npx wrangler deploy` from `site/`), so a Sanity edit
  only reaches the live site once you rebuild and redeploy — no CI/webhook
  is wired up.
- In dev, plain pages refetch Sanity on every request (the client uses
  `useCdn: false` outside production, specifically so this works without a
  restart). Pages using `getStaticPaths` (`portfolio/[slug]`,
  `writing/[slug]`) are the exception — Astro caches that computation for
  the life of the dev server, so those two need a restart to pick up a
  Sanity edit.
- Sanity's image pipeline only handles raster images. PDFs upload as generic
  files with no transforms.

## Current status

Site shell and first templates are built: home, CV, colophon, 404, and all
four main nav destinations (`/portfolio`, `/drawings`, `/writing`) exist.

Sanity is connected to a real project (`site/.env` and `studio/.env` both
set), with real project content published in the Studio. `placeholder-data.ts`
is gone entirely — `portfolio`, `drawings`, and `writing` all read live from
`sanity.ts`. `siteSettings` (location, email, CV file, social links) is wired
into `Base.astro`'s footer and `cv.astro`, falling back to hardcoded values
if the document is empty or unpublished.

Schema is split into `projectDrawing` (nested in `project.drawings`) and a
standalone top-level `drawing` document type ("Drawing (standalone)" in the
Studio sidebar), so drawings that aren't part of any studio project can
still be published. `/drawings` queries both and merges them into one list,
sorted newest-first by a `date` field (added to both `project` and the
standalone `drawing` type specifically for this — day precision isn't
needed, just enough to order things correctly).

Real images render via `DrawingImage.astro`: srcset built from Sanity's CDN
(`urlFor().width(n).auto('format')`). Default is natural aspect ratio, no
cropping — the box is sized to the image's own ratio (via
`asset->metadata.dimensions.aspectRatio`), not a guessed fixed one. The one
exception is a `crop` prop used only for the Portfolio index's small
per-project thumbnail, where a uniform card shape matters more than showing
the whole sheet (plain 4:3, object-fit: cover). Focal-point-aware cropping
(using each image's hotspot) isn't wired in there yet.

`/drawings` and the project page's drawing grid use a hand-rolled masonry
(plain JS, not a framework island — same category as the filter script):
items walk in Studio order, each placed into whichever column (or run of
columns, for a `size: 'large'`/`'full'` item) is currently shortest, so
total height stays minimal without reordering by height the way CSS
multi-column would. `size` on `projectDrawing`/`drawing` picks how many
columns: normal (1), large (2), full (all current columns — converges with
large at the 2-column breakpoint, and with normal at 1 column). Re-runs on
filter changes and window resize.

The Portfolio project page: hero (first drawing, capped height, centered)
above a short prose description (`project.description`, plain rich text —
keep it to a sentence or two, this is a summary not the full write-up) above
the rest of the drawings in the masonry grid. Tried a side-by-side hero/
description layout; reverted since it only worked with a long description.

Gotcha specific to `getStaticPaths`: unlike a plain page's frontmatter
(which re-fetches every request in dev), Astro computes `getStaticPaths`
once and caches it for the life of the dev server — editing content in
Sanity Studio doesn't invalidate it. `portfolio/[slug].astro` and
`writing/[slug].astro` both use it, so a dev server restart is needed to
see Sanity edits there specifically, separately from the CDN-cache gotcha
below.

The Lightbox is built (see Key Features) and wired into both `/drawings`
and the project page — every drawing is clickable except the Portfolio
index's small representative thumbnail, which stays a plain link to the
project.

Still to do: deploy the Studio (`npm run deploy` from `studio/`) to
studio.cillianloftus.com; `/private/[slug]`.
