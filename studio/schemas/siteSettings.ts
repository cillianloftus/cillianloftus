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
			title: 'CV File',
			type: 'file',
		}),
		defineField({
			name: 'socialLinks',
			title: 'Social Links',
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
							description: 'For the Email icon, use a mailto: link, e.g. mailto:you@example.com',
							validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https', 'mailto'] }),
						}),
						defineField({
							name: 'icon',
							title: 'Icon',
							type: 'string',
							options: {
								list: [
									{ title: 'LinkedIn', value: 'linkedin' },
									{ title: 'GitHub', value: 'github' },
									{ title: 'Instagram', value: 'instagram' },
									{ title: 'Pinterest', value: 'pinterest' },
									{ title: 'Spotify', value: 'spotify' },
									{ title: 'Email', value: 'email' },
								],
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
