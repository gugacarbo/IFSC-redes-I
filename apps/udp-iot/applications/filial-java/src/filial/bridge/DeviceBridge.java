package filial.bridge;

import filial.config.ConfigManager;
import filial.model.DeviceManager;
import filial.model.DeviceState;
import filial.network.ws.WebSocketSession;
import lib.logging.Logger;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

public class DeviceBridge {

    private static final Logger logger = Logger.getLogger(DeviceBridge.class);

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final DeviceManager deviceManager;
    private final WsMessageHandler wsMessageHandler;

    public DeviceBridge(DeviceManager deviceManager, ConfigManager configManager) {
        this.deviceManager = deviceManager;
        this.wsMessageHandler = new WsMessageHandler(deviceManager, configManager, this);
    }

    public void onSessionOpened(WebSocketSession session) {
        sessions.add(session);
        logger.info("DeviceBridge: GUI client connected: {} ({} total)", session.remoteAddress(), sessions.size());
        sendDevicesUpdated(session);
    }

    public void onSessionClosed(WebSocketSession session) {
        sessions.remove(session);
        logger.info("DeviceBridge: GUI client disconnected: {} ({} remaining)", session.remoteAddress(), sessions.size());
    }

    public void sessionReadLoop(WebSocketSession session) {
        try {
            while (session.isOpen()) {
                String message = session.readFrame();
                if (message == null) break;
                wsMessageHandler.handle(message);
            }
        } catch (IOException e) {
            if (session.isOpen()) {
                logger.error("DeviceBridge: Session read error: {}", e.getMessage());
            }
        } finally {
            onSessionClosed(session);
            session.close();
        }
    }

    public void broadcastDevicesUpdated() {
        String json = buildDevicesUpdatedJson();
        broadcast(json);
    }

    public void broadcast(String json) {
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendText(json);
                }
            } catch (IOException e) {
                onSessionClosed(session);
                session.close();
            }
        }
    }

    public int sessionCount() {
        return sessions.size();
    }

    private void sendDevicesUpdated(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.sendText(buildDevicesUpdatedJson());
            }
        } catch (IOException e) {
        }
    }

    private String buildDevicesUpdatedJson() {
        JsonObject envelope = new JsonObject();
        envelope.put("type", "devices_updated");

        JsonArray devices = new JsonArray();
        for (Map.Entry<String, DeviceState> entry : deviceManager.getAll().entrySet()) {
            String id = entry.getKey();
            DeviceState state = entry.getValue();
            JsonObject dev = new JsonObject();
            dev.put("id", id);
            dev.put("isLight", state.isLight());
            dev.put("isSensor", state.isSensor());
            dev.put("boolValue", state.boolValue());
            dev.put("intValue", state.intValue());
            devices.add(dev);
        }
        envelope.put("devices", devices);
        return envelope.toString();
    }
}
