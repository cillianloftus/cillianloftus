import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder, type ImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { toHTML } from '@portabletext/to-html';
import type { PortableTextBlock } from '@portabletext/types';
import type { Project, SiteSettings, StandaloneDrawing, WritingEntry } from './types';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET || 'production';

export const sanityConfigured = Boolean(projectId);

// Every page silently falls back to empty content when Sanity isn't
// configured (see the `sanityConfigured ? ... : []` pattern throughout
// src/pages), deliberately, so `astro dev` works on a fresh checkout with
// no .env. That same leniency is dangerous for a production build: it
// means a missing/broken SANITY_PROJECT_ID ships an empty site with no
// error at all, rather than failing the build. Fail loudly instead.
if (import.meta.env.PROD && !sanityConfigured) {
	throw new Error(
		'SANITY_PROJECT_ID is not set for a production build. Building without it would silently ship an empty site (no projects, drawings, or writing) — set SANITY_PROJECT_ID (and optionally SANITY_DATASET) in site/.env before running `npm run build`.',
	);
}

let client: SanityClient | undefined;
let builder: ImageUrlBuilder | undefined;

if (projectId) {
	client = createClient({
		projectId,
		dataset,
		apiVersion: '2026-01-01',
		useCdn: import.meta.env.PROD,
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

const drawingImageField = /* groq */ `
	image{
		...,
		"aspectRatio": asset->metadata.dimensions.aspectRatio,
	}
`;

const projectFields = /* groq */ `
	"slug": slug.current,
	title,
	year,
	date,
	location,
	type,
	role,
	description,
	featured,
	drawings[]{
		${drawingImageField},
		caption,
		alt,
		projection,
		medium,
		size,
	}
`;

export async function getProjects(): Promise<Project[]> {
	return getClient().fetch(/* groq */ `
		*[_type == "project" && private != true] | order(date desc) {
			${projectFields}
		}
	`);
}

export async function getFeaturedProjects(): Promise<Project[]> {
	return getClient().fetch(/* groq */ `
		*[_type == "project" && private != true && featured == true] | order(date desc) {
			${projectFields}
		}
	`);
}

export async function getProject(slug: string): Promise<Project | null> {
	return getClient().fetch(
		/* groq */ `
			*[_type == "project" && slug.current == $slug && private != true][0] {
				${projectFields}
			}
		`,
		{ slug },
	);
}

export async function getDrawings(): Promise<StandaloneDrawing[]> {
	return getClient().fetch(/* groq */ `
		*[_type == "drawing"] {
			${drawingImageField},
			caption,
			alt,
			date,
			projection,
			medium,
			fullWidth,
		}
	`);
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

export async function getWritingEntries(): Promise<WritingEntry[]> {
	return getClient().fetch(/* groq */ `
		*[_type == "writing" && draft != true] | order(date desc) {
			${writingFields}
		}
	`);
}

export async function getWritingEntry(slug: string): Promise<WritingEntry | null> {
	return getClient().fetch(
		/* groq */ `
			*[_type == "writing" && slug.current == $slug && draft != true][0] {
				${writingFields}
			}
		`,
		{ slug },
	);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
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
