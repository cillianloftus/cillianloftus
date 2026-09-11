/** Safely serializes a value for embedding in a `<script type="application/ld+json">`
 * tag. JSON.stringify alone isn't HTML-aware — escaping `<` guards against a
 * `</script>` sequence inside the data (a caption, a bio) prematurely closing
 * the tag it's embedded in. */
export function jsonLd(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}
