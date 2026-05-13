package filial;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.util.Map;

/**
 * Handles REST API calls for the filial HTTP server.
 *
 * <p>Routes:
 * <ul>
 *   <li>{@code GET /api/devices} — list all devices with state</li>
 *   <li>{@code POST /api/devices} — add a device</li>
 *   <li>{@code DELETE /api/devices/:id} — remove a device</li>
 *   <li>{@code PUT /api/devices/:oldId} — rename a device</li>
 *   <li>{@code GET /api/config} — return server config</li>
 *   <li>{@code PUT /api/config} — update server config</li>
 *   <li>{@code GET /health} — health check</li>
 * </ul>
 */
public class ApiHandler {

    private final DeviceManager deviceManager;
    private final DeviceBridge deviceBridge;
    private final ThreadLocal<Integer> lastStatusCode = ThreadLocal.withInitial(() -> 200);

    public ApiHandler(DeviceManager deviceManager, DeviceBridge deviceBridge) {
        this.deviceManager = deviceManager;
        this.deviceBridge = deviceBridge;
    }

    public String handle(String method, String path, String body) {
        method = method.toUpperCase();
        path = path.split("\\?")[0];

        try {
            if (path.equals("/api/devices")) {
                return switch (method) {
                    case "GET" -> handleGetDevices();
                    case "POST" -> handlePostDevice(body);
                    case "OPTIONS" -> handleOptions();
                    default -> jsonError(405, "Method not allowed");
                };
            }
            if (path.startsWith("/api/devices/")) {
                String deviceId = path.substring("/api/devices/".length());
                return switch (method) {
                    case "DELETE" -> handleDeleteDevice(deviceId);
                    case "PUT" -> handlePutDevice(deviceId, body);
                    case "OPTIONS" -> handleOptions();
                    default -> jsonError(405, "Method not allowed");
                };
            }
            if (path.equals("/api/config")) {
                return switch (method) {
                    case "GET" -> handleGetConfig();
                    case "PUT" -> handlePutConfig(body);
                    case "OPTIONS" -> handleOptions();
                    default -> jsonError(405, "Method not allowed");
                };
            }
            if (path.equals("/health") || path.equals("/api/health")) {
                if ("GET".equals(method) || "OPTIONS".equals(method)) {
                    lastStatusCode.set(200);
                    return "{\"status\":\"ok\",\"devices\":" + deviceManager.count() + "}";
                }
                return jsonError(405, "Method not allowed");
            }

            return jsonError(404, "Not found");
        } catch (Exception e) {
            System.err.println("ApiHandler: Error: " + e.getMessage());
            return jsonError(500, "Internal server error");
        }
    }

    public int lastStatusCode() {
        return lastStatusCode.get();
    }

    // ---- Device handlers ----

    private String handleGetDevices() {
        lastStatusCode.set(200);
        JsonArray arr = new JsonArray();
        for (Map.Entry<String, DeviceState> entry : deviceManager.getAll().entrySet()) {
            String id = entry.getKey();
            DeviceState state = entry.getValue();
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

    private String handlePostDevice(String body) {
        if (body == null || body.isBlank()) {
            lastStatusCode.set(400);
            return jsonError(400, "Empty body");
        }
        try {
            JsonObject obj = Json.parseObject(body);
            String id = obj.getString("id", "");
            if (id.isEmpty()) {
                lastStatusCode.set(400);
                return jsonError(400, "Missing id");
            }
            deviceManager.addDevice(id);
            deviceBridge.broadcastDevicesUpdated();
            lastStatusCode.set(201);
            return "{\"id\":" + Json.escape(id) + "}";
        } catch (Exception e) {
            lastStatusCode.set(400);
            return jsonError(400, "Invalid JSON");
        }
    }

    private String handleDeleteDevice(String deviceId) {
        boolean removed = deviceManager.removeDevice(deviceId);
        if (!removed) {
            lastStatusCode.set(404);
            return jsonError(404, "Device not found");
        }
        deviceBridge.broadcastDevicesUpdated();
        lastStatusCode.set(200);
        return "{\"id\":" + Json.escape(deviceId) + ",\"removed\":true}";
    }

    private String handlePutDevice(String oldId, String body) {
        if (body == null || body.isBlank()) {
            lastStatusCode.set(400);
            return jsonError(400, "Empty body");
        }
        try {
            JsonObject obj = Json.parseObject(body);
            String newId = obj.getString("newId", "");
            if (newId.isEmpty()) {
                lastStatusCode.set(400);
                return jsonError(400, "Missing newId");
            }
            boolean updated = deviceManager.updateDevice(oldId, newId);
            if (!updated) {
                lastStatusCode.set(404);
                return jsonError(404, "Device not found");
            }
            deviceBridge.broadcastDevicesUpdated();
            lastStatusCode.set(200);
            return "{\"oldId\":" + Json.escape(oldId) + ",\"newId\":" + Json.escape(newId) + "}";
        } catch (Exception e) {
            lastStatusCode.set(400);
            return jsonError(400, "Invalid JSON");
        }
    }

    // ---- Config handlers ----

    private String handleGetConfig() {
        lastStatusCode.set(200);
        JsonObject cfg = new JsonObject();
        cfg.put("port", 0);
        cfg.put("adminUser", "admin");
        cfg.put("adminPass", "admin");
        cfg.put("deviceCount", deviceManager.count());
        return cfg.toString();
    }

    private String handlePutConfig(String body) {
        lastStatusCode.set(200);
        return "{\"status\":\"ok\"}";
    }

    // ---- Helpers ----

    private String handleOptions() {
        lastStatusCode.set(204);
        return "";
    }

    private String jsonError(int code, String message) {
        return "{\"error\":\"" + message + "\"}";
    }
}
