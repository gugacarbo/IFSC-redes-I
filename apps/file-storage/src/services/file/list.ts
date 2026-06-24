import type { StoredFile } from "#/types/file";
import { scanStorage } from "./scan";

export async function listFiles({
	offset,
	limit,
	search,
}: {
	offset?: number;
	limit?: number;
	search?: string;
} = {}): Promise<StoredFile[]> {
	const allFiles = await scanStorage({ search });
	const start = offset ?? 0;
	const end = limit !== undefined ? start + limit : undefined;

	return allFiles.slice(start, end);
}

export async function countFiles(search = ""): Promise<number> {
	const allFiles = await scanStorage({ search });
	return allFiles.length;
}
