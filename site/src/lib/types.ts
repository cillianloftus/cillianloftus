import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageSource } from '@sanity/image-url';

export type Projection = 'plan' | 'section' | 'elevation' | 'axonometric' | 'perspective' | 'detail';

export type Medium = 'sketch' | 'hand-drawing' | 'cad' | 'render' | 'model-photo' | 'collage';

export type ProjectType =
	| 'adaptive-reuse'
	| 'conservation'
	| 'healthcare'
	| 'residential'
	| 'public-space'
	| 'educational'
	| 'culture'
	| 'infrastructure'
	| 'commercial'
	| 'industrial'
	| 'mixed-use';

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

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
	{ value: 'adaptive-reuse', label: 'Adaptive Reuse' },
	{ value: 'conservation', label: 'Conservation' },
	{ value: 'healthcare', label: 'Healthcare' },
	{ value: 'residential', label: 'Residential' },
	{ value: 'public-space', label: 'Public Space' },
	{ value: 'educational', label: 'Educational' },
	{ value: 'culture', label: 'Culture' },
	{ value: 'infrastructure', label: 'Infrastructure' },
	{ value: 'commercial', label: 'Commercial' },
	{ value: 'industrial', label: 'Industrial' },
	{ value: 'mixed-use', label: 'Mixed-Use' },
];

/** Slug values -> comma-joined human labels, for display. Tolerates a
 * document still holding `type`'s old single-string shape (pre multi-select)
 * until it's re-saved in the Studio against the new array field. */
export function projectTypeLabels(values: ProjectType[] | ProjectType | undefined): string {
	if (!values) return '';
	const list = Array.isArray(values) ? values : [values];
	return list.map((value) => PROJECT_TYPES.find((t) => t.value === value)?.label ?? value).join(', ');
}

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
	date?: string;
	location?: string;
	type?: ProjectType[];
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
