import dgram from "node:dgram";
import { WebSocket } from "ws";
import { Logger } from "@lib/logging";

const logger = Logger.getLogger("MatrizServer");

export const udpSocket = dgram.createSocket("udp4");
export const wsClients = new Set<WebSocket>();

udpSocket.on("message", (msg, rinfo) => {
	try {
		const data = JSON.parse(msg.toString("utf-8"));
		const wsMsg = JSON.stringify({
			type: "ws_rx",
			source_ip: rinfo.address,
			payload: data,
		});
		for (const ws of wsClients) {
			if (ws.readyState === WebSocket.OPEN) ws.send(wsMsg);
		}
	} catch (e) {
		logger.error("UDP parse error: {}", e);
	}
});

export function sendUdp(targetIp: string, targetPort: number, payload: object) {
	const buf = Buffer.from(JSON.stringify(payload));
	udpSocket.send(buf, targetPort, targetIp, (err) => {
		if (err)
			logger.error("UDP send error to {}:{} {}", targetIp, targetPort, err);
	});
}
