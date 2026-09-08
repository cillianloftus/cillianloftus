import { defineField, defineType } from 'sanity';

export default defineType({
	name: 'siteSettings',
	title: 'Site Settings',
	type: 'document',
	fields: [
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'array',
			of: [{ type: 'block' }],
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'string',
		}),
		defineField({
			name: 'email',
			title: 'Email',
			type: 'string',
		}),
		defineField({
			name: 'cvFile',
			title: 'CV file',
			type: 'file',
		}),
		defineField({
			name: 'socialLinks',
			title: 'Social links',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'socialLink',
					fields: [
						defineField({
							name: 'name',
							title: 'Name',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'url',
							title: 'URL',
							type: 'url',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'icon',
							title: 'Icon',
							type: 'string',
							options: {
								list: ['linkedin', 'github', 'instagram', 'pinterest', 'spotify', 'email'],
							},
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: { title: 'name', subtitle: 'url' },
					},
				},
			],
		}),
	],
	preview: {
		prepare() {
			return { title: 'Site Settings' };
		},
	},
});
