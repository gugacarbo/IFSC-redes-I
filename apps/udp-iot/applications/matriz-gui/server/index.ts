import http from "node:http";
import { Logger } from "@lib/logging";
import cors from "cors";
import express from "express";
import { WebSocketServer } from "ws";
import { loadConfig, setCurrentConfig } from "./config.js";
import { udpSocket } from "./udp.js";
import { startPolling } from "./polling.js";
import { setupWebSocket } from "./websocket.js";
import { setupRoutes } from "./routes.js";

const logger = Logger.getLogger("MatrizServer");

const PORT = parseInt(process.env.MATRIZ_PORT || "3001", 10);

const app = express();
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:4173",
		],
	}),
);
app.use(express.json());

setupRoutes(app);

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });
setupWebSocket(wss);

setCurrentConfig(loadConfig());
udpSocket.bind(0, () => {
	logger.info("UDP socket bound to dynamic port {}", udpSocket.address().port);
	startPolling();
});
server.listen(PORT, () => {
	logger.info("Matriz server listening on http://localhost:{}", PORT);
	logger.info("WebSocket on ws://localhost:{}/ws", PORT);
});
