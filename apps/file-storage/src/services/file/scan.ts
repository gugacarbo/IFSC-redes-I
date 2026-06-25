import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { StoredFile } from "#/types/file";
import { ensureStorageDir, getStorageDir } from "./path";

export async function scanStorage({
	search,
}: {
	search?: string;
} = {}): Promise<StoredFile[]> {
	await ensureStorageDir();

	const storageDir = getStorageDir();
	const entries = await readdir(storageDir, { withFileTypes: true });
	const normalizedSearch = search?.trim().toLowerCase();

	const files: StoredFile[] = [];

	for (const entry of entries) {
		if (!entry.isFile()) {
			continue;
		}

		if (
			normalizedSearch &&
			!entry.name.toLowerCase().includes(normalizedSearch)
		) {
			continue;
		}

		const filePath = join(storageDir, entry.name);
		const fileStat = await stat(filePath);

		files.push({
			fileName: entry.name,
			size: fileStat.size,
			createdAt: fileStat.birthtime ?? fileStat.mtime,
		});
	}

	return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
