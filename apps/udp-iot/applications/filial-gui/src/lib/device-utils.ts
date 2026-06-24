export function extractPlace(id: string): string {
	return id.split("_").slice(2).join("_");
}

export function toNormalCase(id: string): string {
	const place = extractPlace(id).replace(/_/g, " ");
	return place.replace(/\b\w/g, (c) => c.toUpperCase());
}
