// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://cillianloftus.com',
	integrations: [
		sitemap({
			// Password-gated pages have no business in a public sitemap, even
			// though the gate itself (worker/index.ts) is what actually protects
			// them — this just keeps them from being publicly listed as well.
			// /chrome isn't real content either — worker/index.ts fetches it
			// internally as a source for the real header/footer markup.
			filter: (page) => !page.includes('/private/') && !page.includes('/chrome'),
		}),
	],
});
