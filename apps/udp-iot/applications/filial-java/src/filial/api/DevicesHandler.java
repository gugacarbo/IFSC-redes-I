package filial.api;

import filial.bridge.DeviceBridge;
import filial.config.ConfigManager;
import filial.model.DeviceManager;
import lib.logging.Logger;
import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.util.Map;

public class DevicesHandler {

    private static final Logger logger = Logger.getLogger(DevicesHandler.class);

    private final DeviceManager deviceManager;
    private final DeviceBridge deviceBridge;
    private final ConfigManager configManager;

    public DevicesHandler(DeviceManager deviceManager, DeviceBridge deviceBridge, ConfigManager configManager) {
        this.deviceManager = deviceManager;
        this.deviceBridge = deviceBridge;
        this.configManager = configManager;
    }

    public String handleGetDevices() {
        JsonArray arr = new JsonArray();
        for (Map.Entry<String, filial.model.DeviceState> entry : deviceManager.getAll().entrySet()) {
            String id = entry.getKey();
            filial.model.DeviceState state = entry.getValue();
            JsonObject dev = new JsonObject();
            dev.put("id", id);
            dev.put("isLight", state.isLight());
            dev.put("isSensor", state.isSensor());
            dev.put("boolValue", state.boolValue());
            dev.put("intValue", state.intValue());
            arr.add(dev);
        }
        return arr.toString();
    }

    public String handlePostDevice(String body) {
        if (body == null || body.isBlank()) {
            return ApiHandler.jsonError(400, "Empty body");
        }
        try {
            JsonObject obj = Json.parseObject(body);
            String id = obj.getString("id", "").trim();
            if (id.isEmpty()) {
                return ApiHandler.jsonError(400, "Missing id");
            }
            if (!configManager.addDevice(id)) {
                return ApiHandler.jsonError(500, "Could not persist device");
            }
            deviceManager.addDevice(id);
            deviceBridge.broadcastDevicesUpdated();
            return "{\"id\":" + Json.escape(id) + "}";
        } catch (Exception e) {
            return ApiHandler.jsonError(400, "Invalid JSON");
        }
    }

    public String handleDeleteDevice(String deviceId) {
        if (deviceManager.get(deviceId) == null) {
            return ApiHandler.jsonError(404, "Device not found");
        }
        if (!configManager.removeDevice(deviceId)) {
            return ApiHandler.jsonError(500, "Could not persist device removal");
        }
        deviceManager.removeDevice(deviceId);
        deviceBridge.broadcastDevicesUpdated();
        return "{\"id\":" + Json.escape(deviceId) + ",\"removed\":true}";
    }

    public String handlePutDevice(String oldId, String body) {
        if (body == null || body.isBlank()) {
            return ApiHandler.jsonError(400, "Empty body");
        }
        try {
            JsonObject obj = Json.parseObject(body);
            String newId = obj.getString("newId", "").trim();
            if (newId.isEmpty()) {
                return ApiHandler.jsonError(400, "Missing newId");
            }
            if (deviceManager.get(oldId) == null) {
                return ApiHandler.jsonError(404, "Device not found");
            }
            if (deviceManager.get(newId) != null) {
                return ApiHandler.jsonError(409, "Device already exists");
            }
            if (!configManager.renameDevice(oldId, newId)) {
                return ApiHandler.jsonError(500, "Could not persist device rename");
            }
            boolean updated = deviceManager.updateDevice(oldId, newId);
            if (!updated) {
                return ApiHandler.jsonError(500, "Could not update runtime device");
            }
            deviceBridge.broadcastDevicesUpdated();
            return "{\"oldId\":" + Json.escape(oldId) + ",\"newId\":" + Json.escape(newId) + "}";
        } catch (Exception e) {
            return ApiHandler.jsonError(400, "Invalid JSON");
        }
    }
}
