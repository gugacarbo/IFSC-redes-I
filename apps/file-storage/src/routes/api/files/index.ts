import { Logger } from "@lib/logging";
import { createFileRoute } from "@tanstack/react-router";
import type { GET_REQ, LIST_REQ, PUT_REQ } from "#/@types/command";
import { handleGetRequest } from "./handlers/get-handler";
import { handleListRequest } from "./handlers/list-handler";
import { handlePutRequest } from "./handlers/put-handler";

const logger = Logger.getLogger("FilesAPI");

export const Route = createFileRoute("/api/files/")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as LIST_REQ | PUT_REQ | GET_REQ;

					if (!body?.cmd) {
						return new Response(
							JSON.stringify({ error: "Missing cmd in body" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					switch (body.cmd) {
						case "list_req":
							return handleListRequest();
						case "put_req":
							return handlePutRequest(body as PUT_REQ);
						case "get_req":
							return handleGetRequest(body as GET_REQ);
						default:
							return new Response(
								JSON.stringify({ error: "Invalid command" }),
								{
									status: 400,
									headers: { "Content-Type": "application/json" },
								},
							);
					}
				} catch (error) {
					logger.error("Error parsing request body: {}", error);
					return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
						status: 400,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
