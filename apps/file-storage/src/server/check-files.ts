import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getExistingFileNames } from "#/services/file-service";

export const checkFileConflicts = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			fileNames: z.array(z.string().min(1)),
		}),
	)
	.handler(async ({ data }): Promise<{ existingFiles: string[] }> => {
		const existingFiles = await getExistingFileNames(data.fileNames);
		return { existingFiles };
	});
