import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppInfo } from "../../types.js";

// Read README.md for a given app. Now using a concrete AppInfo type for correctness.
export function readAppDocs(app: AppInfo): string {
	const readmePath = join(app.path, "README.md");
	if (!existsSync(readmePath)) {
		return "README.md nao encontrado para este app.";
	}

	try {
		return readFileSync(readmePath, "utf-8");
	} catch {
		return "Nao foi possivel ler o README.md deste app.";
	}
}
