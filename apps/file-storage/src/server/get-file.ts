import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getFileById } from "#/services/file-service";

export interface FileData {
	fileName: string;
	hash: string;
	value: string;
}

const getFileParamsSchema = z.object({
	id: z.number(),
});

export const getFileFn = createServerFn({
	method: "GET",
})
	.inputValidator(getFileParamsSchema)
	.handler(async ({ data }): Promise<FileData | null> => {
		try {
			const result = await getFileById(data.id);
			return result;
		} catch (error) {
			console.error("Error getting file:\n", error);
			return null;
		}
	});
