import { WebSocketServer } from "ws";
import { Logger } from "@lib/logging";
import { currentConfig } from "./config.js";
import { wsClients, sendUdp } from "./udp.js";

const logger = Logger.getLogger("MatrizServer");

export function setupWebSocket(wss: WebSocketServer): void {
	wss.on("connection", (ws) => {
		wsClients.add(ws);

		ws.on("message", (raw) => {
			try {
				const msg = JSON.parse(raw.toString());
				if (msg.type === "ws_tx") {
					const filial = currentConfig.filiais.find(
						(f: { ip: string }) => f.ip === msg.target_ip,
					);
					if (!filial) {
						ws.send(
							JSON.stringify({
								type: "ws_error",
								message: `Filial com IP ${msg.target_ip} não encontrada`,
							}),
						);
						return;
					}
					const payload = {
						...msg.payload,
						user: currentConfig.user,
						pass: currentConfig.pass,
					};
					sendUdp(msg.target_ip, filial.port, payload);
				}
			} catch (e) {
				logger.error("WS message error: {}", e);
			}
		});

		ws.on("close", () => wsClients.delete(ws));
	});
}
