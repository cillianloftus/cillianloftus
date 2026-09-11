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

function loginPage({ redirect, error }: { redirect: string; error: boolean }): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Private &middot; Cillian Loftus</title>
<style>
	:root {
		--color-bg: #ffffff;
		--color-text: #101010;
		--color-text-muted: #68675f;
		--color-border: #e3e2de;
		--color-accent: #a8402f;
		--color-surface: #f7f6f3;
		color-scheme: light;
	}
	@media (prefers-color-scheme: dark) {
		:root {
			--color-bg: #1c1a17;
			--color-text: #f2f1ee;
			--color-text-muted: #9d9c96;
			--color-border: #3a352c;
			--color-accent: #e0785f;
			--color-surface: #26221d;
			color-scheme: dark;
		}
	}
	* { box-sizing: border-box; }
	body {
		margin: 0;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--color-bg);
		color: var(--color-text);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
	}
	main { width: 100%; max-width: 22rem; }
	h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
	p { color: var(--color-text-muted); font-size: 0.9rem; margin: 0 0 1.5rem; }
	form { display: flex; flex-direction: column; gap: 0.75rem; }
	input[type="password"] {
		font: inherit;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-surface);
		color: var(--color-text);
	}
	input[type="password"]:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}
	button {
		font: inherit;
		font-weight: 600;
		min-height: 44px;
		padding: 0.75rem;
		border: 1px solid var(--color-accent);
		border-radius: 4px;
		background: var(--color-accent);
		color: #fff;
		cursor: pointer;
	}
	button:hover, button:focus-visible { opacity: 0.9; }
	.error { color: var(--color-accent); font-size: 0.85rem; margin: -0.25rem 0 0; }
</style>
</head>
<body>
<main>
	<h1>This page is private</h1>
	<p>Enter the password to continue.</p>
	<form method="POST">
		<input type="hidden" name="redirect" value="${escapeHtml(redirect)}">
		<input type="password" name="password" autofocus required>
		${error ? '<p class="error">Incorrect password.</p>' : ''}
		<button type="submit">Enter</button>
	</form>
</main>
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

			return new Response(loginPage({ redirect, error: true }), {
				status: 401,
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		}

		return new Response(loginPage({ redirect: url.pathname, error: false }), {
			status: 401,
			headers: { 'content-type': 'text/html; charset=utf-8' },
		});
	},
} satisfies ExportedHandler<Env>;
