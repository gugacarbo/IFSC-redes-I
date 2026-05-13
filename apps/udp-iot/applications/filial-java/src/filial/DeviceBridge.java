package filial;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Bridges WebSocket GUI clients with the local DeviceManager.
 *
 * <p>Manages connected WebSocket sessions, handles GUI messages
 * (set_device, add_device, remove_device), and broadcasts
 * device state updates to all connected clients.
 */
public class DeviceBridge {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final DeviceManager deviceManager;
    private final ConfigManager configManager;

    public DeviceBridge(DeviceManager deviceManager, ConfigManager configManager) {
        this.deviceManager = deviceManager;
        this.configManager = configManager;
    }

    public void onSessionOpened(WebSocketSession session) {
        sessions.add(session);
        System.out.println("DeviceBridge: GUI client connected: " + session.remoteAddress()
            + " (" + sessions.size() + " total)");
        // Send current state immediately
        sendDevicesUpdated(session);
    }

    public void onSessionClosed(WebSocketSession session) {
        sessions.remove(session);
        System.out.println("DeviceBridge: GUI client disconnected: " + session.remoteAddress()
            + " (" + sessions.size() + " remaining)");
    }

    public void sessionReadLoop(WebSocketSession session) {
        try {
            while (session.isOpen()) {
                String message = session.readFrame();
                if (message == null) break;
                handleWsMessage(message, session);
            }
        } catch (IOException e) {
            if (session.isOpen()) {
                System.err.println("DeviceBridge: Session read error: " + e.getMessage());
            }
        } finally {
            onSessionClosed(session);
            session.close();
        }
    }

    private void handleWsMessage(String message, WebSocketSession session) {
        try {
            JsonObject msg = Json.parseObject(message);
            String type = msg.getString("type", "");

            switch (type) {
                case "set_device" -> handleSetDevice(msg);
                case "add_device" -> handleAddDevice(msg);
                case "remove_device" -> handleRemoveDevice(msg);
                default -> System.err.println("DeviceBridge: Unknown WS message type: " + type);
            }
        } catch (Exception e) {
            System.err.println("DeviceBridge: Error handling WS message: " + e.getMessage());
        }
    }

    private void handleSetDevice(JsonObject msg) {
        String id = msg.getString("id", "");
        if (id.isEmpty()) return;
        DeviceState state = deviceManager.get(id);
        if (state == null || state.isSensor()) return;

        if (state.isLight()) {
            deviceManager.set(id, msg.getBoolean("value"));
        } else {
            deviceManager.set(id, msg.getInt("value"));
        }
        broadcastDevicesUpdated();
    }

    private void handleAddDevice(JsonObject msg) {
        String id = msg.getString("id", "");
        if (id.isEmpty()) return;
        deviceManager.addDevice(id);
        broadcastDevicesUpdated();
    }

    private void handleRemoveDevice(JsonObject msg) {
        String id = msg.getString("id", "");
        if (id.isEmpty()) return;
        deviceManager.removeDevice(id);
        broadcastDevicesUpdated();
    }

    /** Broadcast devices_updated to all connected clients. */
    public void broadcastDevicesUpdated() {
        String json = buildDevicesUpdatedJson();
        broadcast(json);
    }

    private void sendDevicesUpdated(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.sendText(buildDevicesUpdatedJson());
            }
        } catch (IOException e) {
            System.err.println("DeviceBridge: Error sending to " + session.remoteAddress());
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

    public void broadcast(String json) {
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendText(json);
                }
            } catch (IOException e) {
                System.err.println("DeviceBridge: Broadcast error to "
                    + session.remoteAddress() + ": " + e.getMessage());
                onSessionClosed(session);
                session.close();
            }
        }
    }

    public int sessionCount() {
        return sessions.size();
    }
}
