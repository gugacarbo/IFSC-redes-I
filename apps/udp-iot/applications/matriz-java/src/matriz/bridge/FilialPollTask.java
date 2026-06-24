package matriz.bridge;

import lib.logging.Logger;
import shared.Json;
import shared.Json.JsonObject;
import shared.Protocol;
import matriz.config.ConfigManager;
import matriz.model.FilialInfo;
import matriz.model.MatrizConfig;
import matriz.network.udp.UdpClient;
import matriz.state.FilialStateTracker;

class FilialPollTask {

	private static final Logger logger = Logger.getLogger(FilialPollTask.class);

	private static final int UDP_TIMEOUT_MS = 2000;

	private final ConfigManager configManager;
	private final UdpClient udpClient;
	private final BridgeManager bridgeManager;
	private final FilialStateTracker stateTracker;

	FilialPollTask(ConfigManager configManager, UdpClient udpClient,
				   BridgeManager bridgeManager, FilialStateTracker stateTracker) {
		this.configManager = configManager;
		this.udpClient = udpClient;
		this.bridgeManager = bridgeManager;
		this.stateTracker = stateTracker;
	}

	void poll(FilialInfo filial, MatrizConfig cfg) {
		String ip = filial.ip();
		int port = filial.port();

		try {
			String listReq = new JsonObject()
				.put(Protocol.FIELD_CMD, Protocol.CMD_LIST_REQ)
				.put(Protocol.FIELD_USER, cfg.user())
				.put(Protocol.FIELD_PASS, cfg.pass())
				.toString();

			String listResp = udpClient.sendAndReceive(ip, port, listReq, UDP_TIMEOUT_MS);
			if (listResp != null) {
				stateTracker.markContacted(ip);

				JsonObject envelope = new JsonObject();
				envelope.put(Protocol.WS_TYPE, Protocol.WS_RX);
				envelope.put(Protocol.WS_SOURCE_IP, ip);
				try {
					envelope.put(Protocol.WS_PAYLOAD, Json.parseObject(listResp));
				} catch (Exception e) {
					envelope.put(Protocol.WS_PAYLOAD, listResp);
				}
				bridgeManager.broadcast(envelope.toString());
			}

			String getReq = new JsonObject()
				.put(Protocol.FIELD_CMD, Protocol.CMD_GET_STATUS)
				.put(Protocol.FIELD_USER, cfg.user())
				.put(Protocol.FIELD_PASS, cfg.pass())
				.toString();

			String getResp = udpClient.sendAndReceive(ip, port, getReq, UDP_TIMEOUT_MS);
			if (getResp != null) {
				try {
					JsonObject parsed = Json.parseObject(getResp);
					stateTracker.updateDeviceState(ip, parsed);
				} catch (Exception e) {
					stateTracker.markContacted(ip);
				}

				JsonObject envelope = new JsonObject();
				envelope.put(Protocol.WS_TYPE, Protocol.WS_RX);
				envelope.put(Protocol.WS_SOURCE_IP, ip);
				try {
					envelope.put(Protocol.WS_PAYLOAD, Json.parseObject(getResp));
				} catch (Exception e) {
					envelope.put(Protocol.WS_PAYLOAD, getResp);
				}
				bridgeManager.broadcast(envelope.toString());
			}

		} catch (Exception e) {
			logger.error("Polling: Error polling {}", filial.displayString(), e.getMessage());
		}
	}
}
