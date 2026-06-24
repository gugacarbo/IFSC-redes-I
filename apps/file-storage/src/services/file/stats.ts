import { scanStorage } from "./scan";

export interface FileStats {
	count: number;
	totalSize: number;
	uploadsToday: number;
}

export async function getTotalSize(): Promise<number> {
	const files = await scanStorage();
	return files.reduce((total, file) => total + file.size, 0);
}

export async function filesStats(): Promise<FileStats> {
	const files = await scanStorage();
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	return {
		count: files.length,
		totalSize: files.reduce((total, file) => total + file.size, 0),
		uploadsToday: files.filter((file) => file.createdAt >= startOfToday).length,
	};
}
