import { createServerFn } from "@tanstack/react-start";

import { putReqSchema } from "#/@types/command";
import { putFile, validateFileInput } from "#/services/file-service";

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

			await putFile(validatedInput);

			return {
				fileName: validatedInput.fileName,
				success: true,
			};
		} catch (error) {
			console.error("Error saving file:\n", error);

			return {
				fileName: data.file,
				success: false,
			};
		}
	});
