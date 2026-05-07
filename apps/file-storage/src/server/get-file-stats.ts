import { createServerFn } from "@tanstack/react-start";

import type { FileStats } from "#/services/file-service";
import { filesStats } from "#/services/file-service";

export const getFileStatsFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<FileStats> => {
	try {
		const stats = await filesStats();

		return stats;
	} catch (error) {
		console.error("Error getting file stats:\n", error);

		return {
			count: 0,
			totalSize: 0,
			uploadsToday: 0,
		};
	}
});
