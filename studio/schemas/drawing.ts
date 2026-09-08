import { defineField, defineType } from 'sanity';

const PROJECTIONS = [
	{ title: 'Plan', value: 'plan' },
	{ title: 'Section', value: 'section' },
	{ title: 'Elevation', value: 'elevation' },
	{ title: 'Axonometric', value: 'axonometric' },
	{ title: 'Perspective', value: 'perspective' },
	{ title: 'Detail', value: 'detail' },
];

const MEDIUMS = [
	{ title: 'Sketch', value: 'sketch' },
	{ title: 'Hand Drawing', value: 'hand-drawing' },
	{ title: 'CAD', value: 'cad' },
	{ title: 'Render', value: 'render' },
	{ title: 'Model Photo', value: 'model-photo' },
	{ title: 'Collage', value: 'collage' },
];

export default defineType({
	name: 'drawing',
	title: 'Drawing',
	type: 'object',
	fields: [
		defineField({
			name: 'image',
			title: 'Image',
			type: 'image',
			options: { hotspot: true },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'caption',
			title: 'Caption',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'alt',
			title: 'Alt text',
			description: 'Accessible description for screen readers. Falls back to the caption if left blank.',
			type: 'string',
		}),
		defineField({
			name: 'projection',
			title: 'Projection',
			description: 'Multi-select. A section perspective is both a section and a perspective.',
			type: 'array',
			of: [{ type: 'string' }],
			options: { list: PROJECTIONS },
			validation: (Rule) => Rule.required().min(1),
		}),
		defineField({
			name: 'medium',
			title: 'Medium',
			description: 'Multi-select, optional. A plan sketch is a plan (projection) with sketch medium.',
			type: 'array',
			of: [{ type: 'string' }],
			options: { list: MEDIUMS },
		}),
		defineField({
			name: 'fullWidth',
			title: 'Full width',
			description: 'Span the full grid width on the project page and drawings index.',
			type: 'boolean',
			initialValue: false,
		}),
	],
	preview: {
		select: { title: 'caption', media: 'image' },
	},
});
