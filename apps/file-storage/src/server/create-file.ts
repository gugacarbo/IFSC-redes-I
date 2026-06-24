import { Logger } from "@lib/logging";
import { createServerFn } from "@tanstack/react-start";

import { putReqSchema } from "#/@types/command";
import { putFile, validateFileInput } from "#/services/file-service";

const logger = Logger.getLogger("CreateFile");

export interface CreateFileResult {
	fileName: string;
	success: boolean;
}

export const createFile = createServerFn({
	method: "POST",
})
	.inputValidator(putReqSchema)
	.handler(async ({ data }): Promise<CreateFileResult> => {
		try {
			const validatedInput = await validateFileInput(data);

			await putFile({
				...validatedInput,
				overwrite: data.overwrite,
			});

			return {
				fileName: validatedInput.fileName,
				success: true,
			};
		} catch (error) {
			logger.error("Error saving file: {}", error);

			return {
				fileName: data.file,
				success: false,
			};
		}
	});
