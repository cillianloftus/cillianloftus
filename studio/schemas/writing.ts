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
			name: 'references',
			title: 'Reference images',
			description:
				"Images that support this piece but aren't your own work: a photo or figure you're citing, not illustrating. Shown on the entry page separately from the body text, each credited and linked back to its source, never implied as your own. For diagrams, maps or photographs you made yourself, add them as a standalone Drawing instead and link it back here via that drawing's own 'Related writing' field: those belong on the drawings index, these don't.",
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'referenceImage',
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
							name: 'sourceCredit',
							title: 'Source credit',
							description: 'Who made or owns this, e.g. "Photograph by Jane Doe" or "CSO Ireland".',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'sourceUrl',
							title: 'Source URL',
							description: 'Link to the original.',
							type: 'url',
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: { title: 'caption', subtitle: 'sourceCredit', media: 'image' },
					},
				},
			],
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
