package filial.api;

import filial.bridge.DeviceBridge;
import filial.config.ConfigManager;
import filial.model.DeviceManager;
import lib.logging.Logger;
import shared.LogCapture;

public class ApiHandler {

    private static final Logger logger = Logger.getLogger(ApiHandler.class);

    private final DeviceManager deviceManager;
    private final DevicesHandler devicesHandler;
    private final ConfigHandler configHandler;
    private final LogCapture logCapture;
    private final ThreadLocal<Integer> lastStatusCode = ThreadLocal.withInitial(() -> 200);

    public ApiHandler(
        DeviceManager deviceManager,
        DeviceBridge deviceBridge,
        ConfigManager configManager,
        LogCapture logCapture
    ) {
        this.deviceManager = deviceManager;
        this.devicesHandler = new DevicesHandler(deviceManager, deviceBridge, configManager);
        this.configHandler = new ConfigHandler(configManager, deviceManager);
        this.logCapture = logCapture;
    }

    public String handle(String method, String path, String body) {
        method = method.toUpperCase();
        path = path.split("\\?")[0];

        try {
            if (path.equals("/api/devices")) {
                return switch (method) {
                    case "GET" -> wrapResponse(200, devicesHandler.handleGetDevices());
                    case "POST" -> wrapResponse(201, devicesHandler.handlePostDevice(body));
                    case "OPTIONS" -> wrapResponse(204, "");
                    default -> wrapResponse(405, jsonError(405, "Method not allowed"));
                };
            }
            if (path.startsWith("/api/devices/")) {
                String deviceId = path.substring("/api/devices/".length());
                return switch (method) {
                    case "DELETE" -> wrapResponse(200, devicesHandler.handleDeleteDevice(deviceId));
                    case "PUT" -> wrapResponse(200, devicesHandler.handlePutDevice(deviceId, body));
                    case "OPTIONS" -> wrapResponse(204, "");
                    default -> wrapResponse(405, jsonError(405, "Method not allowed"));
                };
            }
            if (path.equals("/api/config")) {
                return switch (method) {
                    case "GET" -> wrapResponse(200, configHandler.handleGetConfig());
                    case "PUT" -> wrapResponse(200, configHandler.handlePutConfig(body));
                    case "OPTIONS" -> wrapResponse(204, "");
                    default -> wrapResponse(405, jsonError(405, "Method not allowed"));
                };
            }
            if (path.equals("/health") || path.equals("/api/health")) {
                if ("GET".equals(method) || "OPTIONS".equals(method)) {
                    return wrapResponse(200, "{\"status\":\"ok\",\"devices\":" + deviceManager.count() + "}");
                }
                return wrapResponse(405, jsonError(405, "Method not allowed"));
            }
            if (path.equals("/api/logs")) {
                if ("GET".equals(method) || "OPTIONS".equals(method)) {
                    return wrapResponse(200, logsToJson(logCapture.getEntries(200)));
                }
                return wrapResponse(405, jsonError(405, "Method not allowed"));
            }

            return wrapResponse(404, jsonError(404, "Not found"));
        } catch (Exception e) {
            logger.error("ApiHandler: Error: {}", e.getMessage());
            return wrapResponse(500, jsonError(500, "Internal server error"));
        }
    }

    public int lastStatusCode() {
        return lastStatusCode.get();
    }

    public static String jsonError(int code, String message) {
        return "{\"error\":\"" + message + "\"}";
    }

    private String wrapResponse(int statusCode, String body) {
        lastStatusCode.set(statusCode);
        return body;
    }

    private String logsToJson(java.util.List<LogCapture.LogEntry> logEntries) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (LogCapture.LogEntry e : logEntries) {
            if (!first) sb.append(",");
            first = false;
            sb.append("{\"level\":\"").append(e.level)
              .append("\",\"message\":").append(shared.Json.escape(e.message))
              .append(",\"ts\":").append(e.ts).append("}");
        }
        sb.append("]");
        return sb.toString();
    }
}
