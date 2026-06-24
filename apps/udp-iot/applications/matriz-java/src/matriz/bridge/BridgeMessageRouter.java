package matriz.bridge;

import lib.logging.Logger;
import shared.Json;
import shared.Json.JsonObject;
import shared.Protocol;
import matriz.config.ConfigManager;
import matriz.network.udp.UdpClient;
import matriz.network.ws.WebSocketSession;

class BridgeMessageRouter {

	private static final Logger logger = Logger.getLogger(BridgeMessageRouter.class);

	private final ConfigManager configManager;
	private final UdpClient udpClient;

	BridgeMessageRouter(ConfigManager configManager, UdpClient udpClient) {
		this.configManager = configManager;
		this.udpClient = udpClient;
	}

	void handle(String message, WebSocketSession session) {
		try {
			JsonObject msg = Json.parseObject(message);
			String type = msg.getString(Protocol.WS_TYPE, "");

			if (!Protocol.WS_TX.equals(type)) {
				logger.warn("Bridge: Unknown WS message type: {}", type);
				return;
			}

			String targetIp = msg.getString(Protocol.WS_TARGET_IP);
			JsonObject payload = msg.getObject(Protocol.WS_PAYLOAD);

			matriz.model.MatrizConfig cfg = configManager.getConfig();
			payload.put(Protocol.FIELD_USER, cfg.user());
			payload.put(Protocol.FIELD_PASS, cfg.pass());

			int port = configManager.findPortByIp(targetIp);

			String payloadStr = payload.toString();
			logger.info("Bridge: Forwarding to {}:{} -- {}", targetIp, port, payloadStr);

			String response = udpClient.sendAndReceive(targetIp, port, payloadStr);

			if (response != null) {
				JsonObject envelope = new JsonObject();
				envelope.put(Protocol.WS_TYPE, Protocol.WS_RX);
				envelope.put(Protocol.WS_SOURCE_IP, targetIp);
				try {
					envelope.put(Protocol.WS_PAYLOAD, Json.parseObject(response));
				} catch (Exception e) {
					envelope.put(Protocol.WS_PAYLOAD, response);
				}
				session.sendText(envelope.toString());
			} else {
				logger.warn("Bridge: No response from {}:{}", targetIp, port);
			}
		} catch (Exception e) {
			logger.error("Bridge: Error handling WS message: {}", e.getMessage());
		}
	}
}
