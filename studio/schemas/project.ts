import { defineField, defineType } from 'sanity';

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
			name: 'year',
			title: 'Year',
			type: 'string',
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'string',
		}),
		defineField({
			name: 'type',
			title: 'Type',
			description: 'e.g. Housing, Public Space, Healthcare',
			type: 'string',
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
			of: [{ type: 'drawing' }],
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
		select: { title: 'title', subtitle: 'type', media: 'drawings.0.image' },
	},
});
