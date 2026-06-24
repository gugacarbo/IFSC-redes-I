export function extractPlace(id: string): string {
	return id.split("_").slice(2).join("_");
}

export function toNormalCase(s: string): string {
	return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
