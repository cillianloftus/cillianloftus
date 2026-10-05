import { defineField, defineType } from 'sanity';

export default defineType({
	name: 'photo',
	title: 'Photography',
	type: 'document',
	description: 'Personal photography, not tied to any project or piece of writing: its own section of the site, separate from the architecture portfolio.',
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
			description: 'Optional, not every photo needs one.',
			type: 'string',
		}),
		defineField({
			name: 'alt',
			title: 'Alt text',
			description: 'Accessible description for screen readers. Falls back to the caption if left blank.',
			type: 'string',
		}),
		defineField({
			name: 'location',
			title: 'Location',
			description: 'Optional, e.g. "Lisbon, Portugal".',
			type: 'string',
		}),
		defineField({
			name: 'date',
			title: 'Date',
			description: 'Used to sort the photography index, newest first. The exact day rarely matters.',
			type: 'date',
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: {
		select: { title: 'caption', subtitle: 'location', media: 'image' },
	},
});
