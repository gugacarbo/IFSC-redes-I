import { createFileRoute } from "@tanstack/react-router";
import type { PUT_REQ, PUT_RESP } from "#/@types/command";
import { putFile, validateFileInput } from "#/services/file-service";

export const Route = createFileRoute("/api/files/put")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				let fileName = "";

				try {
					const body = (await request.json()) as PUT_REQ;

					if (!body || body.cmd !== "put_req") {
						const response: PUT_RESP = {
							cmd: "put_resp",
							file: body?.file ?? "",
							status: "fail",
						};

						return new Response(JSON.stringify(response), {
							status: 400,
							headers: { "Content-Type": "application/json" },
						});
					}

					fileName = body.file;
					const validatedInput = await validateFileInput(body);
					await putFile(validatedInput);

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
					console.error("Error in put API:", error);

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
			},
		},
	},
});
