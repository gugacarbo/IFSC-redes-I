import { Logger } from "@lib/logging";
import type { PUT_REQ, PUT_RESP } from "#/@types/command";
import { putFile, validateFileInput } from "#/services/file-service";

const logger = Logger.getLogger("PutAPI");

export async function handlePutRequest(body: PUT_REQ): Promise<Response> {
	let fileName = "";

	try {
		if (!body.file || !body.hash || !body.value) {
			const response: PUT_RESP = {
				cmd: "put_resp",
				file: body.file ?? "",
				status: "fail",
			};

			return new Response(JSON.stringify(response), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		fileName = body.file;
		const validatedInput = await validateFileInput(body);
		await putFile({
			...validatedInput,
			overwrite: body.overwrite,
		});

		const response: PUT_RESP = {
			cmd: "put_resp",
			file: validatedInput.fileName,
			status: "ok",
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		logger.error("Error in put API: {}", error);

		const response: PUT_RESP = {
			cmd: "put_resp",
			file: fileName,
			status: "fail",
		};

		return new Response(JSON.stringify(response), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
