import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageSource } from '@sanity/image-url';

export type Projection = 'plan' | 'section' | 'elevation' | 'axonometric' | 'perspective' | 'detail';

export type Medium = 'sketch' | 'hand-drawing' | 'cad' | 'render' | 'model-photo' | 'collage';

export const PROJECTIONS: { value: Projection; label: string }[] = [
	{ value: 'plan', label: 'Plan' },
	{ value: 'section', label: 'Section' },
	{ value: 'elevation', label: 'Elevation' },
	{ value: 'axonometric', label: 'Axonometric' },
	{ value: 'perspective', label: 'Perspective' },
	{ value: 'detail', label: 'Detail' },
];

export const MEDIUMS: { value: Medium; label: string }[] = [
	{ value: 'sketch', label: 'Sketch' },
	{ value: 'hand-drawing', label: 'Hand Drawing' },
	{ value: 'cad', label: 'CAD' },
	{ value: 'render', label: 'Render' },
	{ value: 'model-photo', label: 'Model Photo' },
	{ value: 'collage', label: 'Collage' },
];

export type DrawingImage = SanityImageSource & { aspectRatio: number };

export type DrawingSize = 'normal' | 'large' | 'full';

export interface Drawing {
	image: DrawingImage;
	caption: string;
	alt?: string;
	projection: Projection[];
	medium: Medium[];
	size?: DrawingSize;
}

export interface StandaloneDrawing extends Drawing {
	date: string;
}

export interface Project {
	slug: string;
	title: string;
	year?: string;
	date?: string;
	location?: string;
	type?: string;
	role?: string;
	description?: PortableTextBlock[];
	drawings: Drawing[];
	featured?: boolean;
}

export interface SocialLink {
	name: string;
	url: string;
	icon: string;
}

export interface SiteSettings {
	location?: string;
	email?: string;
	cvFile?: string;
	socialLinks?: SocialLink[];
}

export type WritingCategory = 'article' | 'poetry' | 'dissertation';

export interface WritingEntry {
	slug: string;
	title: string;
	date: string;
	category: WritingCategory;
	summary?: string;
	body?: PortableTextBlock[];
	pdf?: string;
}
