package matriz;
import lib.logging.Logger;

import shared.Json;
import shared.Json.JsonObject;
import shared.Protocol;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Bridges WebSocket GUI clients with UDP filiais.
 *
 * <p>Replaces {@code matriz-esp32/BridgeManager.cpp}.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Manages connected WebSocket sessions</li>
 *   <li>Receives {@code ws_tx} messages from GUI, forwards to filial via UDP</li>
 *   <li>Receives UDP responses, wraps in {@code ws_rx}, broadcasts to GUI</li>
 * </ul>
 */
public class BridgeManager {

    private static final Logger logger = Logger.getLogger(BridgeManager.class);


    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final ConfigManager configManager;
    private final UdpClient udpClient;

    public BridgeManager(ConfigManager configManager, UdpClient udpClient) {
        this.configManager = configManager;
        this.udpClient = udpClient;
    }

    /**
     * Called by {@link AppServer} when a new WebSocket session is established.
     */
    public void onSessionOpened(WebSocketSession session) {
        sessions.add(session);
        logger.info("Bridge: GUI client connected: {} ({} total)", session.remoteAddress(), sessions.size());
    }

    /**
     * Called by {@link AppServer} when a session is closed.
     */
    public void onSessionClosed(WebSocketSession session) {
        sessions.remove(session);
        logger.info("Bridge: GUI client disconnected: {} ({} remaining)", session.remoteAddress(), sessions.size());
    }

    /**
     * Read-loop for a single WebSocket session.
     * Blocks until the session closes.
     */
    public void sessionReadLoop(WebSocketSession session) {
        try {
            while (session.isOpen()) {
                String message = session.readFrame();
                if (message == null) break; // session closed
                handleWsMessage(message, session);
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

    /**
     * Process a message received from a WebSocket GUI client.
     *
     * Expected format:
     * <pre>
     * {"type":"ws_tx","target_ip":"192.168.1.100",
     *  "payload":{"cmd":"set_req","id":"actuator_light_sala","value":true}}
     * </pre>
     */
    private void handleWsMessage(String message, WebSocketSession session) {
        try {
            JsonObject msg = Json.parseObject(message);
            String type = msg.getString(Protocol.WS_TYPE, "");

            if (!Protocol.WS_TX.equals(type)) {
                logger.warn("Bridge: Unknown WS message type: {}", type);
                return;
            }

            String targetIp = msg.getString(Protocol.WS_TARGET_IP);
            JsonObject payload = msg.getObject(Protocol.WS_PAYLOAD);

            // Inject credentials from config
            ConfigManager.MatrizConfig cfg = configManager.getConfig();
            payload.put(Protocol.FIELD_USER, cfg.user());
            payload.put(Protocol.FIELD_PASS, cfg.pass());

            // Find the target filial's port
            int port = configManager.findPortByIp(targetIp);

            String payloadStr = payload.toString();
            logger.info("Bridge: Forwarding to {}:{} — {}", targetIp, port, payloadStr);

            // Send via UDP and wait for response
            String response = udpClient.sendAndReceive(targetIp, port, payloadStr);

            if (response != null) {
                // Wrap response in ws_rx envelope
                JsonObject envelope = new JsonObject();
                envelope.put(Protocol.WS_TYPE, Protocol.WS_RX);
                envelope.put(Protocol.WS_SOURCE_IP, targetIp);
                try {
                    envelope.put(Protocol.WS_PAYLOAD, Json.parseObject(response));
                } catch (Exception e) {
                    // If response isn't a valid JSON object, send as raw string
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

    /**
     * Broadcast a JSON envelope to all connected WebSocket GUI clients.
     * Used by {@link PollingManager} to push updates.
     */
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

    /** Number of connected GUI clients. */
    public int sessionCount() {
        return sessions.size();
    }
}
