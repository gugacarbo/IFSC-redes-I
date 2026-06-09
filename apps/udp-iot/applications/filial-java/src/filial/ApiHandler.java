package filial;

import shared.Json;
import lib.logging.Logger;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import shared.LogCapture;

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

    private static final Logger logger = Logger.getLogger(ApiHandler.class);

    private final DeviceManager deviceManager;
    private final DeviceBridge deviceBridge;
    private final ConfigManager configManager;
    private final LogCapture logCapture;
    private final ThreadLocal<Integer> lastStatusCode = ThreadLocal.withInitial(() -> 200);

    public ApiHandler(
        DeviceManager deviceManager,
        DeviceBridge deviceBridge,
        ConfigManager configManager,
        LogCapture logCapture
    ) {
        this.deviceManager = deviceManager;
        this.deviceBridge = deviceBridge;
        this.configManager = configManager;
        this.logCapture = logCapture;
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
            if (path.equals("/api/logs")) {
                if ("GET".equals(method) || "OPTIONS".equals(method)) {
                    lastStatusCode.set(200);
                    return logsToJson(logCapture.getEntries(200));
                }
                return jsonError(405, "Method not allowed");
            }

            return jsonError(404, "Not found");
        } catch (Exception e) {
            logger.error("ApiHandler: Error: {}", e.getMessage());
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
            String id = obj.getString("id", "").trim();
            if (id.isEmpty()) {
                lastStatusCode.set(400);
                return jsonError(400, "Missing id");
            }
            if (!configManager.addDevice(id)) {
                lastStatusCode.set(500);
                return jsonError(500, "Could not persist device");
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
        if (deviceManager.get(deviceId) == null) {
            lastStatusCode.set(404);
            return jsonError(404, "Device not found");
        }
        if (!configManager.removeDevice(deviceId)) {
            lastStatusCode.set(500);
            return jsonError(500, "Could not persist device removal");
        }
        deviceManager.removeDevice(deviceId);
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
            String newId = obj.getString("newId", "").trim();
            if (newId.isEmpty()) {
                lastStatusCode.set(400);
                return jsonError(400, "Missing newId");
            }
            if (deviceManager.get(oldId) == null) {
                lastStatusCode.set(404);
                return jsonError(404, "Device not found");
            }
            if (deviceManager.get(newId) != null) {
                lastStatusCode.set(409);
                return jsonError(409, "Device already exists");
            }
            if (!configManager.renameDevice(oldId, newId)) {
                lastStatusCode.set(500);
                return jsonError(500, "Could not persist device rename");
            }
            boolean updated = deviceManager.updateDevice(oldId, newId);
            if (!updated) {
                lastStatusCode.set(500);
                return jsonError(500, "Could not update runtime device");
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
        FilialConfig current = configManager.getConfig();
        JsonObject cfg = new JsonObject();
        cfg.put("port", current.port());
        cfg.put("httpPort", current.httpPort());
        cfg.put("adminUser", current.adminUser());
        cfg.put("adminPass", current.adminPass());
        cfg.put("deviceCount", deviceManager.count());
        return cfg.toString();
    }

    private String handlePutConfig(String body) {
        if (body == null || body.isBlank()) {
            lastStatusCode.set(400);
            return jsonError(400, "Empty body");
        }
        try {
            FilialConfig current = configManager.getConfig();
            JsonObject obj = Json.parseObject(body);

            int port = obj.getInt("port", current.port());
            int httpPort = obj.getInt("httpPort", current.httpPort());
            String adminUser = obj.getString("adminUser", current.adminUser()).trim();
            String adminPass = obj.getString("adminPass", current.adminPass()).trim();

            if (port < 1 || port > 65535 || httpPort < 1 || httpPort > 65535) {
                lastStatusCode.set(400);
                return jsonError(400, "Ports must be between 1 and 65535");
            }
            if (adminUser.isEmpty() || adminPass.isEmpty()) {
                lastStatusCode.set(400);
                return jsonError(400, "Admin credentials cannot be empty");
            }
            if (!configManager.updateConfig(port, httpPort, adminUser, adminPass)) {
                lastStatusCode.set(500);
                return jsonError(500, "Could not persist config");
            }

            FilialConfig updated = configManager.getConfig();
            JsonObject response = new JsonObject();
            response.put("port", updated.port());
            response.put("httpPort", updated.httpPort());
            response.put("adminUser", updated.adminUser());
            response.put("adminPass", updated.adminPass());
            response.put("deviceCount", deviceManager.count());
            response.put(
                "restartRequired",
                updated.port() != current.port() || updated.httpPort() != current.httpPort()
            );

            lastStatusCode.set(200);
            return response.toString();
        } catch (Exception e) {
            lastStatusCode.set(400);
            return jsonError(400, "Invalid JSON");
        }
    }

    // ---- Helpers ----

    private String handleOptions() {
        lastStatusCode.set(204);
        return "";
    }

    private String jsonError(int code, String message) {
        return "{\"error\":\"" + message + "\"}";
    }

    private String logsToJson(java.util.List<LogCapture.LogEntry> logEntries) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (LogCapture.LogEntry e : logEntries) {
            if (!first) sb.append(",");
            first = false;
            sb.append("{\"level\":\"").append(e.level)
              .append("\",\"message\":").append(Json.escape(e.message))
              .append(",\"ts\":").append(e.ts).append("}");
        }
        sb.append("]");
        return sb.toString();
    }
}
