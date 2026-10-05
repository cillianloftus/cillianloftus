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
	name: 'drawing',
	title: 'Drawing (standalone)',
	type: 'document',
	description: 'Not tied to any project. For project drawings, add them inside the project itself, in its Drawings field.',
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
			name: 'date',
			title: 'Date',
			description:
				'Project drawings inherit their date from the project; standalone drawings need their own. Used to sort the drawings index, newest first. The exact day rarely matters, pick any day in the right month.',
			type: 'date',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'projection',
			title: 'Projection',
			description:
				'Multi-select, optional. A section perspective is both a section and a perspective. Leave blank for drawings that are not architectural representations at all, e.g. a map or a chart made for a piece of writing.',
			type: 'array',
			of: [{ type: 'string' }],
			options: { list: PROJECTIONS },
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
				'How many grid columns this drawing spans on the drawings index. Normal: 1. Large: 2. Full: however many columns the current screen shows (so it stays full-width at every breakpoint).',
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
		defineField({
			name: 'relatedWriting',
			title: 'Related writing',
			description:
				'Optional. If this drawing was made for (or illustrates) a piece of writing, link it here: the drawings index will credit it back to that piece, the same way a project drawing credits its project.',
			type: 'reference',
			to: [{ type: 'writing' }],
		}),
	],
	preview: {
		select: { title: 'caption', subtitle: 'date', media: 'image' },
	},
});
