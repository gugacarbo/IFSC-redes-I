import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { FileType } from "#/db/schema";
import { countFiles, listFiles } from "#/services/file-service";

export interface ListFilesResult {
	files: FileType[];
	total: number;
	offset: number;
	limit: number;
}

const listFilesParamsSchema = z.object({
	offset: z.number().optional().default(0),
	limit: z.number().optional().default(10),
	search: z.string().optional().default(""),
});

export const listFilesFn = createServerFn({
	method: "GET",
})
	.inputValidator(listFilesParamsSchema)
	.handler(async ({ data }): Promise<ListFilesResult> => {
		const offset = data?.offset ?? 0;
		const limit = data?.limit ?? 10;
		const search = data?.search ?? "";

		try {
			const [filesList, total] = await Promise.all([
				listFiles({ offset, limit, search }),
				countFiles(),
			]);

			return {
				files: filesList,
				total,
				offset,
				limit,
			};
		} catch (error) {
			console.error("Error listing files:\n", error);

			return {
				files: [],
				total: 0,
				offset,
				limit,
			};
		}
	});
