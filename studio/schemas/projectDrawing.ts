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
	{ title: 'Photography', value: 'photography' },
	{ title: 'Collage', value: 'collage' },
];

export default defineType({
	name: 'projectDrawing',
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
			name: 'size',
			title: 'Size',
			description:
				'How many grid columns this drawing spans. Normal: 1. Large: 2. Full: however many columns the current screen shows (so it stays full-width at every breakpoint). Long sections and site plans usually want Large or Full; most drawings want Normal.',
			type: 'string',
			options: {
				list: [
					{ title: 'Normal', value: 'normal' },
					{ title: 'Large (2 columns)', value: 'large' },
					{ title: 'Full width', value: 'full' },
				],
				layout: 'radio',
			},
			initialValue: 'normal',
		}),
	],
	preview: {
		select: { title: 'caption', media: 'image' },
	},
});
