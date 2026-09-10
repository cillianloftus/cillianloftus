import { defineField, defineType } from 'sanity';

const PROJECT_TYPES = [
	{ title: 'Adaptive Reuse', value: 'adaptive-reuse' },
	{ title: 'Conservation', value: 'conservation' },
	{ title: 'Healthcare', value: 'healthcare' },
	{ title: 'Residential', value: 'residential' },
	{ title: 'Public Space', value: 'public-space' },
	{ title: 'Educational', value: 'educational' },
	{ title: 'Culture', value: 'culture' },
	{ title: 'Infrastructure', value: 'infrastructure' },
	{ title: 'Commercial', value: 'commercial' },
	{ title: 'Industrial', value: 'industrial' },
	{ title: 'Mixed-Use', value: 'mixed-use' },
];

export default defineType({
	name: 'project',
	title: 'Project',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: { source: 'title', maxLength: 96 },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'date',
			title: 'Date',
			description:
				'Used to sort drawings and projects chronologically (newest first) and as the displayed year. The exact day rarely matters — pick any day in the right month.',
			type: 'date',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'string',
		}),
		defineField({
			name: 'type',
			title: 'Type',
			description: 'Multi-select — a project can be more than one, e.g. both Housing and Public Space.',
			type: 'array',
			of: [{ type: 'string' }],
			options: { list: PROJECT_TYPES },
		}),
		defineField({
			name: 'role',
			title: 'Role',
			description: 'e.g. "Individual studio project", or your specific contribution on a group project',
			type: 'string',
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'array',
			of: [{ type: 'block' }],
		}),
		defineField({
			name: 'drawings',
			title: 'Drawings',
			description: 'The first drawing is used as the project thumbnail and Open Graph image.',
			type: 'array',
			of: [{ type: 'projectDrawing' }],
		}),
		defineField({
			name: 'private',
			title: 'Private',
			description: 'Excludes this project from public listings; only reachable via /private/[slug].',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'featured',
			title: 'Featured',
			description: 'Surfaces this project on the home page.',
			type: 'boolean',
			initialValue: false,
		}),
	],
	preview: {
		select: { title: 'title', types: 'type', media: 'drawings.0.image' },
		prepare({ title, types, media }) {
			const labels = (types ?? []).map(
				(value: string) => PROJECT_TYPES.find((t) => t.value === value)?.title ?? value,
			);
			return { title, subtitle: labels.join(', '), media };
		},
	},
});
