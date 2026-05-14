import { Logger } from "@lib/logging";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deleteFileById } from "#/services/file-service";

const logger = Logger.getLogger("DeleteFile");

export const deleteFileFn = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			id: z.number(),
		}),
	)
	.handler(async ({ data }): Promise<{ success: boolean }> => {
		try {
			await deleteFileById(data.id);
			return { success: true };
		} catch (error) {
			logger.error("Error deleting file: {}", error);
			return { success: false };
		}
	});
