import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getWritingEntries, portableTextToHtml, sanityConfigured } from '../lib/sanity';

export async function GET(context: APIContext) {
	const entries = sanityConfigured ? await getWritingEntries() : [];

	return rss({
		title: 'Cillian Loftus',
		description: 'Articles, poetry, and dissertation writing from Cillian Loftus.',
		site: context.site ?? 'https://cillianloftus.com',
		items: entries.map((entry) => ({
			title: entry.title,
			pubDate: new Date(entry.date),
			description: entry.summary,
			content: entry.body ? portableTextToHtml(entry.body) : undefined,
			link: `/writing/${entry.slug}/`,
			categories: [entry.category],
		})),
	});
}
