import { createFileRoute } from "@tanstack/react-router";
import type { LIST_REQ, LIST_RESP } from "#/@types/command";
import { countFiles, listFiles } from "#/services/file-service";

export const Route = createFileRoute("/api/files/list")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as LIST_REQ;

					// Validate command
					if (!body || body.cmd !== "list_req") {
						return new Response(JSON.stringify({ error: "Invalid command" }), {
							status: 400,
							headers: { "Content-Type": "application/json" },
						});
					}

					const [filesList] = await Promise.all([
						listFiles({
							offset: 0,
							limit: 1000,
							columns: {
								hash: false,
								path: false,
							},
						}),
						countFiles(),
					]);

					const response: LIST_RESP = {
						cmd: "list_resp",
						files: filesList,
					};

					return new Response(JSON.stringify(response), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("Error in list API:", error);

					const response: LIST_RESP = {
						cmd: "list_resp",
						files: [],
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
