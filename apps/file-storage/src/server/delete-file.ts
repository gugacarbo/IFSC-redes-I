import { Logger } from "@lib/logging";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deleteFileByName } from "#/services/file-service";

const logger = Logger.getLogger("DeleteFile");

export const deleteFileFn = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			fileName: z.string().min(1),
		}),
	)
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		try {
			const success = await deleteFileByName(data.fileName);
			return { success };
		} catch (error) {
			logger.error("Error deleting file: {}", error);
			return { success: false };
		}
	});
