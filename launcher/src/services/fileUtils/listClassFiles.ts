import { readdirSync } from "node:fs";
import { join } from "node:path";

export function listClassFiles(dir: string): string[] {
	const stack: string[] = [dir];
	const classFiles: string[] = [];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) {
			continue;
		}

		const entries = readdirSync(current, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(current, entry.name);
			if (entry.isDirectory()) {
				if (
					entry.name === "node_modules" ||
					entry.name === "target" ||
					entry.name === ".turbo"
				) {
					continue;
				}
				stack.push(fullPath);
				continue;
			}

			if (entry.isFile() && entry.name.endsWith(".class")) {
				classFiles.push(fullPath);
			}
		}
	}

	return classFiles;
}
