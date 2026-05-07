import { createFileRoute } from "@tanstack/react-router";
import type { GET_REQ, GET_RESP } from "#/@types/command";
import { getFileByName } from "#/services/file-service";

export const Route = createFileRoute("/api/files/get")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as GET_REQ;

					if (!body || body.cmd !== "get_req" || !body.file) {
						const response: GET_RESP = {
							cmd: "get_resp",
							file: body?.file ?? "",
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
					console.error("Error in get API:", error);

					let fileName = "";
					try {
						const body = (await request.json()) as GET_REQ;
						fileName = body?.file ?? "";
					} catch {
						// Ignore error reading body again
					}

					const response: GET_RESP = {
						cmd: "get_resp",
						file: fileName,
						hash: "",
						value: "",
					};

					return new Response(JSON.stringify(response), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
