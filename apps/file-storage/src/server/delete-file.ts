import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deleteFileById } from "#/services/file-service";

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
			console.error("Error deleting file:\n", error);
			return { success: false };
		}
	});
