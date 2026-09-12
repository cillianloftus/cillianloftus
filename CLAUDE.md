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
- **Cloudflare Workers (static assets)** — hosting for both site and
  studio, deployed via `wrangler deploy` from each project's own folder,
  not Cloudflare Pages. The main site auto-deploys via a GitHub Actions
  workflow (`.github/workflows/deploy.yml`), triggered by a Sanity webhook
  on every publish/unpublish — not by `git push`, which does nothing on
  its own. The Studio still deploys manually. Domain registered at
  Hostinger, nameservers moved to Cloudflare. The main site is otherwise
  pure static assets with zero Worker code — the one exception is
  `site/worker/index.ts`, a small Worker that only runs in front of
  `/private/*` (via `assets.run_worker_first` in `wrangler.jsonc`) to check
  a password before falling through to the same static assets everything
  else serves from directly. See "Protected pages" below.
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
  worker/                    index.ts — the one Worker script on the site,
                             gates /private/* only (see Key Features)
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
- title, location, role
- **date** — required, used to sort drawings/projects chronologically, and
  as the displayed year (`date.slice(0, 4)`) — no separate `year` field.
  Exact day doesn't matter, only the month/year.
- **type** — optional, multi-select: adaptive-reuse, conservation, healthcare,
  residential, public-space, educational, culture, infrastructure,
  commercial, industrial, mixed-use — ordered roughly most- to
  least-distinctive to Cillian's own body of work, not alphabetically. A
  project can be more than one, e.g. both residential and public space.
- description (rich text)
- drawings — array of `projectDrawing` objects
- private (boolean) — routes to `/private/[slug]`, excluded from public lists
- featured (boolean) — surfaces on home page

### `projectDrawing` (object, nested in project)
- image, caption, alt
- **projection** — required, multi-select: plan, section, elevation,
  axonometric, perspective, detail
- **medium** — optional, multi-select: sketch, hand-drawing, cad, render,
  model-photo, photography, collage. `photography` is for straight
  documentary/existing-condition shots (a site survey, a stitched existing
  elevation) — distinct from `model-photo`, which is specifically a photo
  of a physical study model.
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

Two frames slide directionally on navigate, not a crossfade — a crossfade
was tried first (simpler, and it sidestepped an earlier bug where a
3-slide peek-preview carousel showed inconsistent, distracting slivers of
the neighbor for drawings of very different aspect ratios), but it read as
an unrelated dissolve with no connection to the swipe/click that caused
it. A single-frame directional slide (park-and-swap: exit fully, re-source
while off-screen, enter fully, as two sequential legs) was tried next and
fixed that, but the two legs running one after another read as "swipe out,
*then* swipe in" — connected in direction but not in time, and doubling
the perceived duration in the process. The current version runs both
frames at once: the outgoing drawing and the incoming one are two sibling
frames animating in the same motion, the outgoing one translating fully
off in the direction it was swiped/navigated (a full stage-width
translate, not either frame's own often-narrower width, so it's always
genuinely clear of the stage) while the incoming one enters from the
opposite side over the *same* span of time, so the two read as one motion
influencing each other rather than a cut between two animations. Each
drawing sits in its own sized frame (a plain div, computed to pixel
dimensions in JS from the trigger's known `data-aspect-ratio` and the
stage's available space) filled via `object-fit: contain`, absolutely
positioned and self-centered in the stage via `translate(-50%, -50%)` so
either frame's own size never depends on the other's — the incoming
frame's size is set once, synchronously, before it's ever visible (it
starts parked off-screen, still clipped by the stage's `overflow:
hidden`), so a new drawing's different aspect ratio never visibly "grows"
into place, matching the old single-frame guarantee. CSS `aspect-ratio` on
the `<img>` itself doesn't work for this, since once any real image loads
its own intrinsic pixel size takes over sizing regardless of the declared
ratio. Only one frame is ever the "active" one at rest — the idle frame's
`visibility` is toggled off between navigations, and which physical frame
element is "active" flips after every committed navigation rather than
re-sourcing a single persistent frame, so both are always ready to run the
next transition in either direction. A touch swipe drags the active frame
1:1 with the finger (no animation, so it tracks exactly) while the idle
frame simultaneously tracks in from whichever edge the drag direction
implies — reloading which neighbor it holds if the drag reverses — so the
drag itself already reads as connected, before any release/commit
animation runs. Past the swipe threshold this continues smoothly into a
full navigation from wherever the drag left off; below it, both frames
spring back together. An `isAnimating` guard drops clicks/swipes/key
presses that land mid-transition rather than letting them desync the
index.

The slide runs through the Web Animations API (`el.animate(...)` on each
frame, both started together and awaited via `Promise.all`), not a CSS
transition class — deliberately. A live-drag release needs to hand off
from wherever the finger left the frame (an arbitrary, continuously
changing position) into an animation with explicit start and end values,
and a CSS transition animates from whatever the element's *rendered*
state happens to be; whether the browser has actually painted the drag's
last direct style write before the transition starts isn't guaranteed by
a single `requestAnimationFrame`. A WAAPI animation's keyframes are
explicit values, not "wherever the element currently is," so there's
nothing timing-dependent for the browser to elide — both frames' `from`
values are read directly off the drag state (or `0`/`±slideDistance` for
a button/key nav starting at rest) and passed straight into the keyframes.
Verified by slowing the *actual* browser-native animation to 5% speed via
Chrome DevTools Protocol's `Animation.setPlaybackRate` (not a hand-rolled
slow-motion double) and catching it mid-flight — both frames visible and
animating simultaneously with distinct, correctly-signed transforms,
confirmed via a scripted Playwright session rather than by eye.

Because the slide runs through WAAPI rather than a CSS transition, it's
invisible to the site-wide `prefers-reduced-motion` rule in `global.css`
(that rule only zeroes `animation-duration`/`transition-duration`, which
`el.animate()` never touches) — so the lightbox checks the media query
itself and collapses the slide to 1ms whenever it matches, live via the
query's `change` event rather than read once, so toggling the OS setting
mid-session takes effect immediately. Live touch-drag tracking is
untouched either way, reduced motion or not: it's direct 1:1 finger
tracking with no animation to begin with, and user-initiated drag isn't
the kind of motion the preference is meant to suppress.

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
in from the last one. Backdrop is black at 75% opacity, not fully solid —
the site stays faintly visible behind it, deliberately.

`.lightbox-caption` has a `min-height` reserving 2 lines regardless of the
current drawing's actual caption length — without it, a caption that
happens to wrap to a second line on a narrow (mobile) screen grows
`.lightbox-footer` (`flex-shrink: 0`), which shrinks `.lightbox-stage`
(`flex: 1`) by the same amount, which visibly shifts the image (it's
centered within the stage's own box via `top: 50%`, not the viewport) —
jarring specifically when navigating from a one-line caption to a
two-line one, reported and confirmed on a real phone. Reserving the
2-line height keeps the footer's rendered height constant across
navigation regardless of which drawing's caption is showing, so the stage
— and the image centered in it — no longer moves on account of caption
length. A caption longer than 2 lines still grows past the reservation
and still shifts things, but real captions on this site are short
phrases; two lines already covers what was actually happening.

`loadInto()` (loads a trigger's image/size into a given frame) tags each
call with a per-frame `loadToken`, incremented every call, and only lets a
full-res preload's `onload` write `frame.img.src` if its token still
matches the frame's current one. Needed because a touch drag that reverses
direction mid-swipe calls `loadInto()` again on the same idle frame (to
swap which neighbor it's carrying in), with no cancellation of whatever
preload the first call already kicked off — without the token, a slow
first request's `onload` can still fire after a second, correct one has
already resolved and landed, silently swapping the idle frame back to the
wrong (stale) neighbor's image right as the swipe might commit. Reproduced
and fixed via a deterministic test (not timing-dependent network
throttling, which turned out to hide the race entirely once
`preloadNeighbors`'s own cache warms both neighbors first): a
Playwright-injected fake `Image` class captured `onload` callbacks and
fired the two in-flight ones in reversed order by hand, which reliably
failed pre-fix and passed post-fix.

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

**Protected pages** (`/private/[slug]`) — a single shared password for the
whole section, not per-person access (Cloudflare Access was the other
option; ruled out since this isn't gated for specific known people, just
kept off search and out of casual reach). Enforced server-side in
`site/worker/index.ts`, the one piece of actual Worker code on an
otherwise pure-static-assets site — never a client-side check, which
would just be reading the page source with extra steps. Wired in via
`wrangler.jsonc`'s `assets.run_worker_first: ["/private/*"]`, so every
other path is untouched, served straight from static assets with no
Worker invoked at all.

On a request to `/private/*`: a valid session cookie (`private_auth`,
`HttpOnly; Secure; SameSite=Lax`, 30-day expiry) lets it through to
`env.ASSETS.fetch()` same as any other page; otherwise it serves a login
form. Submitting the correct password sets that cookie (a timestamp +
HMAC-SHA256 signature over it, keyed by a secret that's separate from the
password itself, via Web Crypto's `crypto.subtle` — verified constant-time
on both the password comparison and the signature check, so neither can be
narrowed down by timing) and redirects back to whichever `/private/*` path
was originally requested. Wrong password, tampered/expired/malformed
cookie, or a misconfigured deploy (missing secrets) all fail closed.

The login form's header and footer aren't a hand-copied approximation of
the site's real ones — that was the first approach and it drifted almost
immediately (stale color tokens out of sync with `global.css`, a header
that briefly had no nav in it at all). Instead, `worker/index.ts` fetches
`/chrome` via `env.ASSETS.fetch()` on every request and slices the real
`<header>`/`<footer>`/stylesheet `<link>` out of it. `site/src/pages/
chrome.astro` is what that fetches — `Base.astro` with nothing in the
slot, built as an ordinary static page like any other (excluded from the
sitemap, `noindex`'d, not meant to be visited directly), so its output is
always whatever the real header/footer/CSS/webfont currently are, with
nothing here to go stale. The only CSS actually hand-written in the Worker
now is for the login form itself (`.private-gate` and its children); it
relies on the fetched stylesheet for every color token, spacing value,
and the real IBM Plex Sans webfont rather than redefining any of them.

The content-model side was already there (`project.private`,
`getPrivateProjects()`/`getPrivateProject()` in `sanity.ts`, mirroring the
public `getProjects()`/`getProject()` but filtering `private == true`
instead of excluding it) — `/private/[slug].astro` renders through the
same `ProjectDetail.astro` component `/portfolio/[slug]` does (extracted
from what used to be portfolio-page-only markup, so the two don't
duplicate the hero/description/masonry-grid/lightbox wiring), just with
`Base`'s `noindex` prop set and no `CreativeWork` JSON-LD — a password
gate that's still fully indexed by Google would defeat its own point. The
sitemap (`astro.config.mjs`) filters `/private/` out for the same reason.

Two secrets have to be set against the live Worker before this does
anything — `PRIVATE_ACCESS_PASSWORD` (what a visitor types in) and
`PRIVATE_ACCESS_SECRET` (signs the session cookie, never typed by anyone).
Set them from `site/` with `npx wrangler secret put PRIVATE_ACCESS_PASSWORD`
and `npx wrangler secret put PRIVATE_ACCESS_SECRET` — each prompts
interactively and the value never touches the repo, a commit, or the
GitHub Actions workflow (those only need `CLOUDFLARE_API_TOKEN`/
`CLOUDFLARE_ACCOUNT_ID` to deploy, same as before; secrets set this way
persist on the Worker across every future deploy without being re-sent).
Until both are set, `/private/*` responds `503` rather than either
crashing or — worse — accidentally passing everyone through.

Local testing needs `wrangler dev` (or `wrangler dev --remote`), not
`astro dev` — the password gate is Worker code, and Astro's own dev server
doesn't run Workers at all, so `/private/*` behaves like any other route
in `npm run dev` regardless of the gate. `wrangler dev` reads secrets from
a local `.dev.vars` file (gitignored; `.dev.vars.example` in the repo
shows the two keys it needs) rather than the real Cloudflare-side secrets.
One local-only quirk hit while building this: `wrangler dev` serves over
plain `http://`, so a cookie flagged `Secure` (correctly) won't be sent
back by a real browser or `curl`'s cookie jar — a false "not logged in"
that only happens locally, not in production, where the site is always
HTTPS.

**Search** — Pagefind, not a hosted search service; it builds a static
search index from the built HTML at deploy time (`pagefind --site dist`,
wired in as `package.json`'s `postbuild` script, so it runs automatically
right after `npm run build` — no change needed to the GitHub Actions
deploy workflow). A search icon in the header (`Search.astro`, rendered
from `Base.astro`'s `.header-end` on every page, not just non-home ones)
opens a native `<dialog>` — chosen specifically because a native dialog
shown via `.showModal()` renders in the browser's top layer regardless of
where it sits in the DOM, sidestepping the exact ancestor-stacking-context
problem (`.site-header`'s own `backdrop-filter` creates a containing block
for `position: fixed` descendants) the Lightbox has to work around by
relocating itself to be a direct child of `<body>` — the dialog needs none
of that. Typing runs `pagefind.debouncedSearch()` (Pagefind's own built-in
debounce, not a hand-rolled one) against the lazily-loaded Pagefind
runtime (`/pagefind/pagefind.js`, only fetched on first open, not on every
page view).

**Only testable after a real build** — `npm run dev` (`astro dev`) never
runs the `postbuild` step, so there's no `dist/pagefind/` at all in dev
mode; the search icon and dialog exist there same as anywhere else, but
there's nothing for it to query, so it'll look broken (empty results for
everything) despite nothing being wrong. Same category of gotcha as the
private-page gate needing `wrangler dev` instead of `astro dev` — build
first (`npm run build`), then `npx wrangler dev` or `npx astro preview`
to actually exercise it locally.

**Search covers every public page** (home, `/portfolio`, `/drawings`,
`/writing`, `/cv`, `/colophon`, each `/writing/[slug]`, each public
`/portfolio/[slug]`) **and nothing else** — 8 pages/templates as of the
last build (`Indexed 8 pages` in the `pagefind` postbuild output). Started
scoped to just 4 (writing entries, public portfolio projects, `/cv`,
`/colophon`) and was widened once it was clear the private-exclusion
mechanism was structural rather than a manually-maintained list — see
below — so adding `data-pagefind-body` to the remaining index/hub pages
carried no risk of also exposing `/private/*`. This isn't a
crawl-everything index with exclusions bolted on — it's the reverse and
matters for a concrete reason: Pagefind's indexer only indexes pages
carrying a `data-pagefind-body` attribute *once that attribute exists
anywhere on the site* (its documented behavior — presence anywhere flips
the whole site into opt-in mode, pages without it are skipped entirely).
`/private/[slug]` never carries it, on either of its two possible render
paths (`ProjectDetail.astro` only adds it when its `indexable` prop is
explicitly passed `true`, and only `/portfolio/[slug].astro` ever passes
that — `/private/[slug].astro` doesn't), so it's structurally impossible
for password-gated content to end up sitting in the public search index,
not just something excluded by a rule that has to be remembered and kept
in sync elsewhere. Verified directly, not just reasoned about: decompressed
the built index's fragment files and confirmed exactly the intended URLs
are in there and nothing else, and confirmed searching for the private
project's own name returns zero results.

Search result **titles** come from each page's real `<h1>`, tagged
`data-pagefind-meta="title"` — without it Pagefind falls back to
`document.title`, which on this site always has the `· Cillian Loftus`
suffix baked in (fine as a browser tab title, redundant repeated down a
results list).

**Gotcha hit building this, worth remembering**: dynamically importing
`/pagefind/pagefind.js` — a module that doesn't exist yet at Vite's own
build time, since the postbuild step that generates it hasn't run yet —
threw `__VITE_PRELOAD__ is not defined` at runtime. Vite wraps *any*
`import()` it can see in the source in its own modulepreload helper
regardless of a `/* @vite-ignore */` comment on it, and since the import
target can't be resolved into a real preload chunk list, it leaves a
literal, never-substituted `__VITE_PRELOAD__` token sitting in the output
(a known Vite issue, not specific to Astro or Pagefind — vitejs/vite#18551).
Disabling `vite.build.modulePreload` sitewide did *not* fix it. What
actually worked: hiding the `import()` call from Vite's static analysis
entirely by building it inside a `Function` constructor
(`new Function('specifier', 'return import(specifier)')`) — from the
bundler's perspective there's then no `import()` expression anywhere in
the source to wrap in the first place. This is the standard workaround for
this exact problem across Vite-based static site generators generally,
not something specific to this project.

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
- Open Graph images generated per page at build time from the first drawing
  where one exists — project pages only (`Base`'s `ogImage` prop, sized
  1200×630 via Sanity's CDN). Every other page (home, `/drawings`,
  `/writing`, `/cv`, etc.) falls back to a static default
  (`public/og-default.png`, built from the site's own tokens/font) rather
  than sharing with no preview image at all.
- Canonical `<link>` on every page (`Base.astro`, from `Astro.site` +
  `Astro.url.pathname`), and a `<link rel="preconnect">` to
  `cdn.sanity.io` — every drawing on every page loads from there.
- Structured data (JSON-LD): a sitewide `Person` schema in `Base.astro`
  (built from the same `siteSettings` data powering the footer, so nothing
  to keep in sync by hand), plus a `CreativeWork` schema on project pages.
  The escaping helper (`src/lib/seo.ts`'s `jsonLd()`) matters — plain
  `JSON.stringify` isn't HTML-aware, so a stray `</script>` inside a
  caption or bio could otherwise break out of the tag.
- The one above-the-fold image on a page (a project hero) skips lazy
  loading (`DrawingImage`'s `priority` prop → `loading="eager"
  fetchpriority="high"`) — lazy-loading an LCP element only delays it for
  no benefit. Every other image (grid thumbnails, standalone drawings)
  stays lazy, which is the correct default for anything off-screen at
  first paint.

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

- CV as structured data rendering to both web and PDF, versus simply
  uploading a PDF. Start with the PDF.

## Gotchas

- ~~Publishing in Sanity does not trigger a rebuild~~ — **fixed.** A Sanity
  webhook (filtered to real publishes/unpublishes only, not every draft
  autosave — see the webhook's GROQ filter in Sanity's project settings)
  triggers a GitHub Actions workflow that runs the exact same
  `npm run build && npx wrangler deploy` automatically. Verified working
  both directions: publishing and unpublishing a project both reached the
  live site within about a minute, with no manual step. `workflow_dispatch`
  is also enabled on the same workflow, so a deploy can still be triggered
  by hand from GitHub's Actions tab if needed (e.g. after a code change
  that isn't itself a Sanity edit). The Studio's own deploy is still
  manual — this only automates the main site.
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
the whole sheet (4:3). The crop is requested pre-cropped from Sanity's CDN
(`.width(w).height(w * 3/4).fit('crop')`) rather than sent full-size and
clipped client-side via `object-fit: cover` — the CDN's crop automatically
centers on each image's own hotspot (`options: { hotspot: true }` on the
`projectDrawing`/`drawing` schemas, set per image in the Studio) when one's
been set, falling back to a plain center crop otherwise, same as before.

`/drawings` and the project page's drawing grid use a hand-rolled masonry
(plain JS, not a framework island — same category as the filter script):
items walk in Studio order, each placed into whichever column (or run of
columns, for a `size: 'large'`/`'full'` item) is currently shortest, so
total height stays minimal without reordering by height the way CSS
multi-column would. `size` on `projectDrawing`/`drawing` picks how many
columns: normal (1), large (2), full (all current columns — converges with
large at the 2-column breakpoint, and with normal at 1 column). Re-runs on
filter changes and window resize. Standalone `drawing` documents' `size`
is fetched via GROQ same as project drawings — it wasn't for a while (the
query had a stray `fullWidth` field left over instead, which doesn't exist
on the schema and always returned `undefined`), so every standalone
drawing silently rendered at `normal` span regardless of what was set in
the Studio. Fixed in `getDrawings()` in `sanity.ts`.

The Portfolio project page: hero (first drawing, capped height, left-aligned)
above a short prose description (`project.description`, plain rich text —
keep it to a sentence or two, this is a summary not the full write-up) above
the rest of the drawings in the masonry grid. Tried a side-by-side hero/
description layout; reverted since it only worked with a long description.
The hero's height cap (`maxHeight` prop on `DrawingImage`) also drops the
component's usual `width: 100%` — a height-capped box that stays full-width
stops matching the image's own aspect ratio once the cap kicks in, so the
leftover space showed through as flat `--color-surface` background on either
side. Letting width track the aspect ratio instead means the box always
hugs the image exactly; `.hero-thumb` shrink-wraps to that resolved width
(`width: fit-content`) and pins itself to the left edge (`align-self:
flex-start`) rather than being centered or stretched.

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

The Studio deploys the same way the main site does — Cloudflare Workers
static assets, not Sanity's own hosted `sanity deploy` (which would land on
a `*.sanity.studio` URL instead, not a subdomain of the actual domain).
`studio/wrangler.jsonc` mirrors `site/wrangler.jsonc`'s shape (different
`name`: `cillianloftus-studio`) with one difference —
`not_found_handling: "single-page-application"` instead of `"404-page"`,
since the Studio is a client-side-routed SPA and unknown paths need to
fall back to `index.html`, not a real 404. Deploy is `npm run build && npx
wrangler deploy` from `studio/`, same two-step as the main site.

Live and deployed at `studio.cillianloftus.com` (custom domain added via
the Cloudflare dashboard's Workers & Pages → Domains & Routes → Add Custom
Domain — the DNS record it creates is a `Worker`-type record, same pattern
as the main site's own `cillianloftus.com` record, not a plain CNAME/A),
and registered with the Sanity project (via the "Register Studio" prompt
Sanity shows the first time you open a newly-deployed Studio URL — needed
for schema-aware search, Content Agent, and anything else that reads the
deployed schema). One gotcha hit while setting this up: right after adding
the custom domain, it resolved correctly from public resolvers (1.1.1.1,
8.8.8.8) but not from the browser — a home router had cached the
"nonexistent domain" answer from before the DNS record existed; flushing
local DNS (or just switching networks) cleared it. Not a Cloudflare
problem, just local negative-DNS caching — worth remembering if a freshly
added domain seems to work everywhere except one specific device/network.

`/rss.xml` and an XML sitemap (`@astrojs/sitemap`) are both real now — the
RSS `<link>` in every page's `<head>` used to point at a 404 (the file
didn't exist despite being documented as a route and being the stated
reason a newsletter was ruled out). `astro.config.mjs` now sets `site:
'https://cillianloftus.com'`, which the sitemap integration needs for
absolute URLs. `public/robots.txt` added, pointing at the sitemap. The
sitemap config's `filter` excludes anything under `/private/`, same reason
that route gets `noindex` — see "Protected pages" above.

`/private/[slug]` is built — password gate (`worker/index.ts`), content
query (`getPrivateProjects()`/`getPrivateProject()`), and page template
(shares `ProjectDetail.astro` with `/portfolio/[slug]`) are all in place.
Both Worker secrets are set and the gate is live in production; Christ
Church is currently the one project marked `private: true` and published,
reachable at `/private/christ-church` behind the real password.

**Gotcha, confirmed the hard way:** Sanity content going live requires both
publishing in the Studio *and* a manual rebuild+redeploy of the main site
(`npm run build && npx wrangler deploy` from `site/`) — publishing alone
does not touch the live site. cillianloftus.com was found serving a build
with zero projects/drawings baked in (the deployed `dist` predated the
current Sanity content) until this was caught and redeployed.

Search (see "Search" under Key Features) is wired in — Pagefind indexing
every public page, a header icon opening a native `<dialog>` with results
styled to match the rest of the site.

The home page's `featured` project flag (`project.featured` — its own
schema description says "surfaces this project on the home page") went
unused for a while: `getFeaturedProjects()` existed in `sanity.ts` with no
call site anywhere, so toggling it in Studio did nothing. Fixed by adding
a "Featured work" section to `index.astro`, between the hero and the hub
link list, rendered only when at least one project is actually featured
(no empty heading with nothing under it). Built on a new
`ProjectCard.astro` — the card markup/styles that used to live only in
`portfolio/index.astro` — extracted so the home page's featured cards and
the portfolio index's cards are one shared component, not a hand-copy
(same reasoning as the private-gate's chrome-reuse fix: one changes, the
other can't drift out of sync). Both call sites pass `project` and get the
same `transition:name={project-image-${slug}}` on the thumbnail, so the
View-Transitions hero-morph into `/portfolio/[slug]` still works whichever
page you navigate from — confirmed by comparing the computed
`viewTransitionName` on both ends of a real navigation, not just by
inspecting the markup.
