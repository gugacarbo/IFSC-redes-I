import { Logger } from "@lib/logging";
import type { GET_REQ, GET_RESP } from "#/@types/command";
import { getFileByName } from "#/services/file-service";

const logger = Logger.getLogger("GetAPI");

export async function handleGetRequest(body: GET_REQ): Promise<Response> {
	try {
		if (!body.file) {
			const response: GET_RESP = {
				cmd: "get_resp",
				file: "",
				hash: "",
				value: "",
			};

			return new Response(JSON.stringify(response), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const fileData = await getFileByName(body.file);

		if (!fileData) {
			const response: GET_RESP = {
				cmd: "get_resp",
				file: body.file,
				hash: "",
				value: "",
			};

			return new Response(JSON.stringify(response), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const response: GET_RESP = {
			cmd: "get_resp",
			file: fileData.fileName,
			hash: fileData.hash,
			value: fileData.value,
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		logger.error("Error in get API: {}", error);

		const response: GET_RESP = {
			cmd: "get_resp",
			file: body.file ?? "",
			hash: "",
			value: "",
		};

		return new Response(JSON.stringify(response), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
