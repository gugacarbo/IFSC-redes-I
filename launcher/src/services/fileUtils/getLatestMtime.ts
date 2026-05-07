import { statSync } from "node:fs";

export function getLatestMtime(filePaths: string[]): number {
	let latest = 0;
	for (const filePath of filePaths) {
		const mtime = statSync(filePath).mtimeMs;
		if (mtime > latest) {
			latest = mtime;
		}
	}
	return latest;
}
