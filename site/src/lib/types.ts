export type Projection = 'plan' | 'section' | 'elevation' | 'axonometric' | 'perspective' | 'detail';

export type Medium = 'sketch' | 'cad' | 'render' | 'model-photo' | 'collage';

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
	{ value: 'cad', label: 'CAD' },
	{ value: 'render', label: 'Render' },
	{ value: 'model-photo', label: 'Model Photo' },
	{ value: 'collage', label: 'Collage' },
];

export interface Drawing {
	slug: string;
	caption: string;
	projection: Projection[];
	medium: Medium[];
	fullWidth?: boolean;
}

export interface Project {
	slug: string;
	title: string;
	year: string;
	location: string;
	type: string;
	description: string;
	drawings: Drawing[];
	private?: boolean;
	featured?: boolean;
}

export type WritingCategory = 'article' | 'poetry' | 'dissertation';

export interface WritingEntry {
	slug: string;
	title: string;
	date: string;
	category: WritingCategory;
	summary: string;
	body: string;
	draft?: boolean;
}
