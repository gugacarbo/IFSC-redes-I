import { Logger } from "@lib/logging";
import type { LIST_RESP } from "#/@types/command";
import { listFiles } from "#/services/file-service";

const logger = Logger.getLogger("ListAPI");

export async function handleListRequest(): Promise<Response> {
	try {
		const filesList = await listFiles({ limit: 1000 });

		const response: LIST_RESP = {
			cmd: "list_resp",
			files: filesList.map(({ hash: _hash, ...file }) => file),
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		logger.error("Error in list API: {}", error);

		const response: LIST_RESP = {
			cmd: "list_resp",
			files: [],
		};

		return new Response(JSON.stringify(response), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
