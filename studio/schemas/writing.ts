import { defineField, defineType } from 'sanity';

export default defineType({
	name: 'writing',
	title: 'Writing',
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
			type: 'date',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'string',
			options: {
				list: [
					{ title: 'Article', value: 'article' },
					{ title: 'Poetry', value: 'poetry' },
					{ title: 'Dissertation', value: 'dissertation' },
				],
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'summary',
			title: 'Summary',
			description: 'Short standfirst shown on the writing index.',
			type: 'text',
			rows: 2,
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'array',
			of: [{ type: 'block' }],
		}),
		defineField({
			name: 'pdf',
			title: 'PDF attachment',
			type: 'file',
		}),
		defineField({
			name: 'draft',
			title: 'Draft',
			description: 'Excludes this entry from the build.',
			type: 'boolean',
			initialValue: false,
		}),
	],
	preview: {
		select: { title: 'title', subtitle: 'category' },
	},
});
