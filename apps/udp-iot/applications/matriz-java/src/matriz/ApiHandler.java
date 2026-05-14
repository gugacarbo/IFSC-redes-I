package matriz;
import lib.logging.Logger;

import shared.LogCapture;
import shared.Json;

/**
 * Handles REST API calls without com.sun.net.httpserver dependency.
 *
 * <p>Routes:
 * <ul>
 *   <li>{@code GET /api/config} — return current config as JSON</li>
 *   <li>{@code PUT /api/config} — update config from JSON body</li>
 *   <li>{@code OPTIONS /api/config} — CORS preflight</li>
 *   <li>{@code GET /api/status} — return live status of all filiais and devices</li>
 *   <li>{@code GET /health} — health check</li>
 * </ul>
 *
 * <p>All other paths return 404. Unsupported methods return 405.
 */
public class ApiHandler {

    private static final Logger logger = Logger.getLogger(ApiHandler.class);

    private final ConfigManager configManager;
    private final FilialStateTracker stateTracker;
    private final LogCapture logCapture;
    private int lastStatusCode = 200;

    private final PollingManager pollingManager;

    public ApiHandler(ConfigManager configManager, FilialStateTracker stateTracker,
                      LogCapture logCapture, PollingManager pollingManager) {
        this.configManager = configManager;
        this.stateTracker = stateTracker;
        this.logCapture = logCapture;
        this.pollingManager = pollingManager;
    }

    /**
     * Handle a REST request.
     *
     * @param method HTTP method (GET, PUT, OPTIONS)
     * @param path   URI path (/api/config, /health, etc.)
     * @param body   Request body (for PUT)
     * @return JSON response body
     */
    public String handle(String method, String path, String body) {
        // Normalise
        method = method.toUpperCase();
        path = path.split("\\?")[0]; // strip query params

        try {
            return switch (path) {
                case "/api/config" -> handleConfig(method, body);
                case "/api/status" -> handleStatus(method);
                case "/health"     -> handleHealth(method);
                case "/api/logs"   -> handleLogs(method);
                default -> jsonError(404, "Not found");
            };
        } catch (Exception e) {
            logger.error("ApiHandler: Error: {}", e.getMessage());
            return jsonError(500, "Internal server error");
        }
    }

    /** Return the HTTP status code from the last handle() call. */
    public int lastStatusCode() {
        return lastStatusCode;
    }

    // ---- Route handlers ----

    private String handleConfig(String method, String body) {
        switch (method) {
            case "GET" -> {
                lastStatusCode = 200;
                return configManager.getConfigJson();
            }
            case "PUT" -> {
                if (body == null || body.isBlank()) {
                    lastStatusCode = 400;
                    return jsonError(400, "Empty body");
                }
                boolean ok = configManager.save(body);
                if (ok) {
                    // Restart polling with new config
                    pollingManager.restart();
                    lastStatusCode = 200;
                    return "{\"status\":\"ok\"}";
                } else {
                    lastStatusCode = 400;
                    return jsonError(400, "Invalid config");
                }
            }
            case "OPTIONS" -> {
                lastStatusCode = 204;
                return "";
            }
            default -> {
                lastStatusCode = 405;
                return jsonError(405, "Method not allowed");
            }
        }
    }

    private String handleHealth(String method) {
        if ("GET".equals(method) || "OPTIONS".equals(method)) {
            ConfigManager.MatrizConfig cfg = configManager.getConfig();
            String health = "{\"status\":\"ok\",\"filiais\":" + cfg.filiais().size()
                + ",\"polling_ms\":" + cfg.pollingMs() + "}";
            lastStatusCode = 200;
            return health;
        }
        lastStatusCode = 405;
        return jsonError(405, "Method not allowed");
    }

    private String handleStatus(String method) {
        if ("GET".equals(method) || "OPTIONS".equals(method)) {
            lastStatusCode = 200;
            java.util.List<FilialInfo> filiais = configManager.getConfig().filiais();
            return stateTracker.getAllStates(filiais).toString();
        }
        lastStatusCode = 405;
        return jsonError(405, "Method not allowed");
    }

    private String handleLogs(String method) {
        if ("GET".equals(method) || "OPTIONS".equals(method)) {
            lastStatusCode = 200;
            return logsToJson(logCapture.getEntries(200));
        }
        lastStatusCode = 405;
        return jsonError(405, "Method not allowed");
    }

    // ---- Helpers ----

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
