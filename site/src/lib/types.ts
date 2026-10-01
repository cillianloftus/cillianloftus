import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageSource } from '@sanity/image-url';

export type Projection = 'plan' | 'section' | 'elevation' | 'axonometric' | 'perspective' | 'detail';

export type Medium = 'sketch' | 'hand-drawing' | 'cad' | 'render' | 'model-photo' | 'photography' | 'collage';

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
	{ value: 'photography', label: 'Photography' },
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
	/** Optional, not required: a non-architectural drawing (a map or chart
	 * made for a piece of writing, say) often has no real projection at all. */
	projection?: Projection[];
	medium?: Medium[];
	size?: DrawingSize;
}

export interface StandaloneDrawing extends Drawing {
	date: string;
	/** Set when this drawing was made for (or illustrates) a piece of
	 * writing: mirrors how a project drawing credits back to its project,
	 * just via an explicit reference instead of nesting. */
	relatedWriting?: { slug: string; title: string };
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

/** Supports a piece of writing but isn't the author's own work: a cited
 * photo or figure, not an illustration. Always credited and linked back to
 * its source; never rendered as a Drawing, which would imply authorship. */
export interface WritingReference {
	image: DrawingImage;
	caption: string;
	alt?: string;
	sourceCredit: string;
	sourceUrl: string;
}

export interface WritingEntry {
	slug: string;
	title: string;
	date: string;
	category: WritingCategory;
	summary?: string;
	body?: PortableTextBlock[];
	pdf?: string;
	references?: WritingReference[];
}

export interface Photo {
	image: DrawingImage;
	caption?: string;
	alt?: string;
	location?: string;
	date: string;
}
