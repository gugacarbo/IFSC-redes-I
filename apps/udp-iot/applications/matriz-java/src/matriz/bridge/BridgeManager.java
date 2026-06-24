package matriz.bridge;

import lib.logging.Logger;
import shared.Protocol;
import matriz.config.ConfigManager;
import matriz.network.udp.UdpClient;
import matriz.network.ws.WebSocketSession;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class BridgeManager {

	private static final Logger logger = Logger.getLogger(BridgeManager.class);

	private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
	private final BridgeMessageRouter router;

	public BridgeManager(ConfigManager configManager, UdpClient udpClient) {
		this.router = new BridgeMessageRouter(configManager, udpClient);
	}

	public void onSessionOpened(WebSocketSession session) {
		sessions.add(session);
		logger.info("Bridge: GUI client connected: {} ({} total)", session.remoteAddress(), sessions.size());
	}

	public void onSessionClosed(WebSocketSession session) {
		sessions.remove(session);
		logger.info("Bridge: GUI client disconnected: {} ({} remaining)", session.remoteAddress(), sessions.size());
	}

	public void sessionReadLoop(WebSocketSession session) {
		try {
			while (session.isOpen()) {
				String message = session.readFrame();
				if (message == null) break;
				router.handle(message, session);
			}
		} catch (IOException e) {
			if (session.isOpen()) {
				logger.error("Bridge: Session read error: {}", e.getMessage());
			}
		} finally {
			onSessionClosed(session);
			session.close();
		}
	}

	public void broadcast(String envelopeJson) {
		for (WebSocketSession session : sessions) {
			try {
				if (session.isOpen()) {
					session.sendText(envelopeJson);
				}
			} catch (IOException e) {
				logger.error("Bridge: Broadcast error to {}: {}", session.remoteAddress(), e.getMessage());
				onSessionClosed(session);
				session.close();
			}
		}
	}

	public int sessionCount() {
		return sessions.size();
	}
}
