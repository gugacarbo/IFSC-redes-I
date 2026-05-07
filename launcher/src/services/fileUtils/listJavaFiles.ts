import { readdirSync } from "node:fs";
import { join } from "node:path";

export function listJavaFiles(dir: string): string[] {
	const stack: string[] = [dir];
	const javaFiles: string[] = [];

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

			if (entry.isFile() && entry.name.endsWith(".java")) {
				javaFiles.push(fullPath);
			}
		}
	}

	return javaFiles;
}
