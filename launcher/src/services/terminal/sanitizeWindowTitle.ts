export function sanitizeWindowTitle(value: string): string {
	return value.replace(/[&|<>^]/g, " ").trim();
}
