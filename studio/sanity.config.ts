import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

if (!projectId) {
	throw new Error(
		'Missing SANITY_STUDIO_PROJECT_ID. Create a project at https://www.sanity.io/manage, then add it to studio/.env (see .env.example).',
	);
}

export default defineConfig({
	name: 'default',
	title: 'Cillian Loftus',
	projectId,
	dataset,
	plugins: [
		structureTool({
			structure: (S) =>
				S.list()
					.title('Content')
					.items([
						S.listItem()
							.title('Site Settings')
							.id('siteSettings')
							.child(S.document().schemaType('siteSettings').documentId('siteSettings')),
						S.divider(),
						...S.documentTypeListItems().filter((item) => item.getId() !== 'siteSettings'),
					]),
		}),
		visionTool(),
	],
	schema: {
		types: schemaTypes,
	},
});
