// The main site is otherwise pure static assets (no Worker code at all) —
// this is the one exception, scoped via wrangler.jsonc's
// `assets.run_worker_first: ["/private/*"]` so every other request still
// goes straight to the static assets binding untouched. A shared password,
// not per-person auth (Cloudflare Access) — see CLAUDE.md's "Protected
// pages" section for why. Client-side password checks were ruled out from
// the start (trivially bypassed by reading the page source), so this has
// to run server-side, and the only server this site has is this Worker.

export interface Env {
	ASSETS: Fetcher;
	PRIVATE_ACCESS_PASSWORD: string;
	PRIVATE_ACCESS_SECRET: string;
}

const COOKIE_NAME = 'private_auth';
const SESSION_SECONDS = 30 * 24 * 60 * 60; // 30 days

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(value: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
	]);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
	return toHex(signature);
}

// Constant-time comparison so a wrong guess can't be narrowed down by
// measuring how long the comparison took to fail.
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return mismatch === 0;
}

function getCookie(request: Request, name: string): string | null {
	const header = request.headers.get('Cookie');
	if (!header) return null;
	for (const part of header.split(';')) {
		const [key, ...rest] = part.trim().split('=');
		if (key === name) return decodeURIComponent(rest.join('='));
	}
	return null;
}

async function isValidSession(cookieValue: string, secret: string): Promise<boolean> {
	const [expiryStr, signature] = cookieValue.split('.');
	if (!expiryStr || !signature) return false;
	const expiry = Number(expiryStr);
	if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
	return timingSafeEqual(signature, await hmac(expiryStr, secret));
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

interface SiteChrome {
	styleLinks: string;
	skipLink: string;
	header: string;
	mainOpenTag: string;
	footer: string;
	headScript: string;
	bodyScript: string;
}

// Pulls the actual rendered header/footer/CSS straight from the built site
// (site/src/pages/chrome.astro — Base.astro with nothing in the slot)
// instead of maintaining a second hand-written copy of them here. A hand
// copy is exactly what this replaced: it drifted (stale color tokens
// out of sync with global.css, a header missing the nav entirely for a
// while) because nothing forced the two to stay in sync. Fetched fresh on
// every request via the ASSETS binding — cheap (an internal binding call,
// not a real network hop) and guarantees this always matches whatever the
// rest of the site actually looks like, including after a redesign, with
// no line here needing to change.
async function fetchSiteChrome(env: Env, origin: string): Promise<SiteChrome | null> {
	const res = await env.ASSETS.fetch(new Request(new URL('/chrome', origin)));
	if (!res.ok) return null;
	const html = await res.text();

	const styleLinks = (html.match(/<link rel="stylesheet"[^>]*>/g) ?? []).join('');
	const skipLink = html.match(/<a class="skip-link"[\s\S]*?<\/a>/)?.[0];
	const header = html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0];
	const mainOpenTag = html.match(/<main id="main"[^>]*>/)?.[0];
	const footer = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)?.[0];
	// The two untyped <script> blocks in Base.astro: the head's theme-flash
	// prevention IIFE (first) and the body-closing theme-toggle/nav-toggle
	// script (last). The other <script> tags on the page (ClientRouter,
	// JSON-LD) have a `type` attribute so this pattern skips them.
	const scripts = html.match(/<script>[\s\S]*?<\/script>/g) ?? [];

	if (!header || !mainOpenTag || !footer) return null;
	return {
		styleLinks,
		skipLink: skipLink ?? '',
		header,
		mainOpenTag,
		footer,
		headScript: scripts[0] ?? '',
		bodyScript: scripts[scripts.length - 1] ?? '',
	};
}

function loginPage(chrome: SiteChrome | null, { redirect, error }: { redirect: string; error: boolean }): string {
	// Falls back to a bare, unstyled (but fully functional) form if the
	// chrome fetch ever fails — the password gate itself must never break
	// just because its cosmetic wrapper couldn't be fetched.
	const head = chrome
		? `${chrome.headScript}${chrome.styleLinks}`
		: `<style>body{font-family:sans-serif;max-width:22rem;margin:3rem auto;padding:0 1rem}</style>`;
	const bodyStart = chrome ? `${chrome.skipLink}${chrome.header}${chrome.mainOpenTag}` : `<main id="main">`;
	const bodyEnd = chrome ? `</main>${chrome.footer}${chrome.bodyScript}` : `</main>`;

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Private &middot; Cillian Loftus</title>
${head}
<style>
	.private-gate {
		/* No max-width here (unlike the form below) — the heading needs
		   room to stay on one line at ordinary viewport widths, and a
		   width constraint tight enough for the form ("Enter the password
		   to continue.") was too tight for "This page is private." next to
		   it, forcing an avoidable wrap. */
		padding-block: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.private-gate .eyebrow {
		font-size: var(--step--1);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
	}
	.private-gate h1 { font-size: var(--step-4); font-weight: 500; letter-spacing: -0.02em; line-height: 1.05; }
	.private-gate .lede { color: var(--color-text-muted); font-size: var(--step-0); }
	.private-gate form { display: flex; flex-direction: column; gap: var(--space-2); max-width: 22rem; }
	.private-gate input[type="password"] {
		font: inherit;
		min-height: 44px;
		padding-inline: var(--space-2);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
	}
	/* :focus rather than :focus-visible — this field is autofocused on
	   load, and whether an autofocused (not keyboard- or click-triggered)
	   element counts as "focus-visible" is inconsistent across browsers, so
	   :focus-visible alone left the ring not showing at all in some of them. */
	.private-gate input[type="password"]:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}
	/* Neutralizes the browser's own autofill background (usually a jarring
	   yellow/blue) via a same-color inset box-shadow trick — background
	   itself can't be overridden directly on an autofilled field. */
	.private-gate input[type="password"]:-webkit-autofill {
		-webkit-text-fill-color: var(--color-text);
		box-shadow: 0 0 0 1000px var(--color-surface) inset;
		transition: background-color 5000s ease-in-out 0s;
	}
	.private-gate button {
		font: inherit;
		font-weight: 600;
		font-size: var(--step--1);
		min-height: 44px;
		padding-inline: var(--space-3);
		border: 1px solid var(--color-accent);
		background: var(--color-accent);
		color: var(--color-bg);
		cursor: pointer;
		transition: opacity 0.15s ease;
	}
	.private-gate button:hover, .private-gate button:focus-visible { opacity: 0.85; }
	.private-gate .error { color: var(--color-accent); font-size: var(--step--1); margin-top: calc(var(--space-1) * -1); }
</style>
</head>
<body>
${bodyStart}
	<div class="private-gate">
		<p class="eyebrow">Private</p>
		<h1>This page is private.</h1>
		<p class="lede">Enter the password to continue.</p>
		<form method="POST">
			<input type="hidden" name="redirect" value="${escapeHtml(redirect)}">
			<input type="password" name="password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" autofocus required>
			${error ? '<p class="error">Incorrect password.</p>' : ''}
			<button type="submit">Enter</button>
		</form>
	</div>
${bodyEnd}
<script>
	// Mobile browsers (iOS Safari in particular) deliberately refuse to open
	// the on-screen keyboard for a field focused via \`autofocus\` or a
	// script-triggered .focus() with no real tap behind it — a genuine user
	// gesture is required, by design, so the keyboard can't pop open on its
	// own before someone's actually touched the screen. This can't be fully
	// worked around, but the first tap ANYWHERE on the page (not just
	// precisely on the small input box) re-focusing the field is the
	// closest practical improvement: it counts as a real gesture, so the
	// keyboard opens from it reliably.
	document.addEventListener(
		'pointerdown',
		function () {
			var input = document.querySelector('input[name="password"]');
			if (input) input.focus();
		},
		{ once: true },
	);
</script>
</body>
</html>`;
}

function safeRedirectPath(value: string | null): string {
	return value && value.startsWith('/private') ? value : '/private';
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (!url.pathname.startsWith('/private')) {
			return env.ASSETS.fetch(request);
		}

		if (!env.PRIVATE_ACCESS_PASSWORD || !env.PRIVATE_ACCESS_SECRET) {
			return new Response('This section is not configured yet.', { status: 503 });
		}

		const cookie = getCookie(request, COOKIE_NAME);
		if (cookie && (await isValidSession(cookie, env.PRIVATE_ACCESS_SECRET))) {
			return env.ASSETS.fetch(request);
		}

		if (request.method === 'POST') {
			const form = await request.formData();
			const password = String(form.get('password') ?? '');
			const redirect = safeRedirectPath(String(form.get('redirect') ?? ''));

			if (timingSafeEqual(password, env.PRIVATE_ACCESS_PASSWORD)) {
				const expiry = Date.now() + SESSION_SECONDS * 1000;
				const value = `${expiry}.${await hmac(String(expiry), env.PRIVATE_ACCESS_SECRET)}`;
				return new Response(null, {
					status: 303,
					headers: {
						Location: redirect,
						'Set-Cookie': `${COOKIE_NAME}=${value}; Path=/private; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`,
					},
				});
			}

			const chrome = await fetchSiteChrome(env, url.origin);
			return new Response(loginPage(chrome, { redirect, error: true }), {
				status: 401,
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		}

		const chrome = await fetchSiteChrome(env, url.origin);
		return new Response(loginPage(chrome, { redirect: url.pathname, error: false }), {
			status: 401,
			headers: { 'content-type': 'text/html; charset=utf-8' },
		});
	},
} satisfies ExportedHandler<Env>;
