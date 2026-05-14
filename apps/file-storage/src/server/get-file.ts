import { Logger } from "@lib/logging";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getFileById } from "#/services/file-service";

const logger = Logger.getLogger("GetFile");

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
			logger.error("Error getting file: {}", error);
			return null;
		}
	});
