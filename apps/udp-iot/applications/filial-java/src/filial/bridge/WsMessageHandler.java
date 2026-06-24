package filial.bridge;

import filial.config.ConfigManager;
import filial.model.DeviceManager;
import filial.model.DeviceState;
import lib.logging.Logger;
import shared.Json.JsonObject;

public class WsMessageHandler {

    private static final Logger logger = Logger.getLogger(WsMessageHandler.class);

    private final DeviceManager deviceManager;
    private final ConfigManager configManager;
    private final DeviceBridge deviceBridge;

    public WsMessageHandler(DeviceManager deviceManager, ConfigManager configManager, DeviceBridge deviceBridge) {
        this.deviceManager = deviceManager;
        this.configManager = configManager;
        this.deviceBridge = deviceBridge;
    }

    public void handle(String message) {
        try {
            JsonObject msg = shared.Json.parseObject(message);
            String type = msg.getString("type", "");

            switch (type) {
                case "set_device" -> handleSetDevice(msg);
                case "add_device" -> handleAddDevice(msg);
                case "remove_device" -> handleRemoveDevice(msg);
                default -> logger.warn("DeviceBridge: Unknown WS message type: {}", type);
            }
        } catch (Exception e) {
            logger.error("DeviceBridge: Error handling WS message: {}", e.getMessage());
        }
    }

    private void handleSetDevice(JsonObject msg) {
        String id = msg.getString("id", "").trim();
        if (id.isEmpty()) return;
        DeviceState state = deviceManager.get(id);
        if (state == null || state.isSensor()) return;

        if (state.isLight()) {
            deviceManager.set(id, msg.getBoolean("value"));
        } else {
            deviceManager.set(id, msg.getInt("value"));
        }
        deviceBridge.broadcastDevicesUpdated();
    }

    private void handleAddDevice(JsonObject msg) {
        String id = msg.getString("id", "").trim();
        if (id.isEmpty()) return;
        if (!configManager.addDevice(id)) {
            logger.error("DeviceBridge: Could not persist added device {}", id);
            return;
        }
        deviceManager.addDevice(id);
        deviceBridge.broadcastDevicesUpdated();
    }

    private void handleRemoveDevice(JsonObject msg) {
        String id = msg.getString("id", "").trim();
        if (id.isEmpty()) return;
        if (deviceManager.get(id) == null) return;
        if (!configManager.removeDevice(id)) {
            logger.error("DeviceBridge: Could not persist removed device {}", id);
            return;
        }
        deviceManager.removeDevice(id);
        deviceBridge.broadcastDevicesUpdated();
    }
}
