import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getExistingFileVariants as getVariants } from "#/services/file-service";

export const findExistingFileVariants = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			fileNames: z.array(z.string().min(1)),
		}),
	)
	.handler(async ({ data }): Promise<{ existingFiles: string[] }> => {
		const existingFiles = await getVariants(data.fileNames);
		return { existingFiles };
	});
