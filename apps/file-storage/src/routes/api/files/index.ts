import { createFileRoute } from "@tanstack/react-router";
import type {
	GET_REQ,
	GET_RESP,
	LIST_REQ,
	LIST_RESP,
	PUT_REQ,
	PUT_RESP,
} from "#/@types/command";
import {
	countFiles,
	getFileByName,
	listFiles,
	putFile,
	validateFileInput,
} from "#/services/file-service";

export const Route = createFileRoute("/api/files/")({
	server: {
		handlers: {
			// POST handler - uses body for command
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as LIST_REQ | PUT_REQ | GET_REQ;

					if (!body || !body.cmd) {
						return new Response(
							JSON.stringify({ error: "Missing cmd in body" }),
							{ status: 400, headers: { "Content-Type": "application/json" } },
						);
					}

					// Route based on command
					switch (body.cmd) {
						case "list_req": {
							try {
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
						}

						case "put_req": {
							const putBody = body as PUT_REQ;
							let fileName = "";

							try {
								if (!putBody.file || !putBody.hash || !putBody.value) {
									const response: PUT_RESP = {
										cmd: "put_resp",
										file: putBody.file ?? "",
										status: "fail",
									};
									return new Response(JSON.stringify(response), {
										status: 400,
										headers: { "Content-Type": "application/json" },
									});
								}

								fileName = putBody.file;
								const validatedInput = await validateFileInput(putBody);
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
						}

						case "get_req": {
							const getBody = body as GET_REQ;

							try {
								if (!getBody.file) {
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

								// Find file by name
								const fileData = await getFileByName(getBody.file);

								if (!fileData) {
									const response: GET_RESP = {
										cmd: "get_resp",
										file: getBody.file,
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
								const response: GET_RESP = {
									cmd: "get_resp",
									file: getBody.file ?? "",
									hash: "",
									value: "",
								};
								return new Response(JSON.stringify(response), {
									status: 500,
									headers: { "Content-Type": "application/json" },
								});
							}
						}

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
					console.error("Error parsing request body:", error);
					return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
						status: 400,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
