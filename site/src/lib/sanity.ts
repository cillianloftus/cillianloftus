import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder, type ImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { toHTML } from '@portabletext/to-html';
import type { PortableTextBlock } from '@portabletext/types';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET || 'production';

export const sanityConfigured = Boolean(projectId);

let client: SanityClient | undefined;
let builder: ImageUrlBuilder | undefined;

if (projectId) {
	client = createClient({
		projectId,
		dataset,
		apiVersion: '2026-01-01',
		useCdn: true,
	});
	builder = createImageUrlBuilder(client);
}

export function getClient(): SanityClient {
	if (!client) {
		throw new Error(
			'Sanity is not configured. Set SANITY_PROJECT_ID (and optionally SANITY_DATASET) in site/.env, see .env.example.',
		);
	}
	return client;
}

/** Build a Sanity CDN image URL. Chain width()/height()/etc. per Sanity's image-url API before calling .url(). */
export function urlFor(source: SanityImageSource): ImageUrlBuilder {
	if (!builder) {
		throw new Error('Sanity is not configured: cannot build an image URL.');
	}
	return builder.image(source);
}

/** Render a portable text (rich text) field to an HTML string. */
export function portableTextToHtml(blocks: PortableTextBlock[] | undefined): string {
	if (!blocks || blocks.length === 0) return '';
	return toHTML(blocks);
}

const projectFields = /* groq */ `
	"slug": slug.current,
	title,
	year,
	location,
	type,
	role,
	description,
	featured,
	drawings[]{
		"slug": _key,
		image,
		caption,
		alt,
		projection,
		medium,
		fullWidth,
	}
`;

export async function getProjects() {
	return getClient().fetch(/* groq */ `
		*[_type == "project" && private != true] | order(_createdAt asc) {
			${projectFields}
		}
	`);
}

export async function getFeaturedProjects() {
	return getClient().fetch(/* groq */ `
		*[_type == "project" && private != true && featured == true] | order(_createdAt asc) {
			${projectFields}
		}
	`);
}

export async function getProject(slug: string) {
	return getClient().fetch(
		/* groq */ `
			*[_type == "project" && slug.current == $slug && private != true][0] {
				${projectFields}
			}
		`,
		{ slug },
	);
}

const writingFields = /* groq */ `
	"slug": slug.current,
	title,
	date,
	category,
	summary,
	body,
	"pdf": pdf.asset->url,
`;

export async function getWritingEntries() {
	return getClient().fetch(/* groq */ `
		*[_type == "writing" && draft != true] | order(date desc) {
			${writingFields}
		}
	`);
}

export async function getWritingEntry(slug: string) {
	return getClient().fetch(
		/* groq */ `
			*[_type == "writing" && slug.current == $slug && draft != true][0] {
				${writingFields}
			}
		`,
		{ slug },
	);
}

export async function getSiteSettings() {
	return getClient().fetch(/* groq */ `
		*[_type == "siteSettings"][0] {
			bio,
			location,
			email,
			"cvFile": cvFile.asset->url,
			socialLinks[]{ name, url, icon },
		}
	`);
}
