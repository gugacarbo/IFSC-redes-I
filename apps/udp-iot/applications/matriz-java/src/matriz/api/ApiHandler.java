package matriz.api;

import lib.logging.Logger;
import shared.LogCapture;
import matriz.bridge.PollingManager;
import matriz.config.ConfigManager;
import matriz.model.FilialInfo;
import matriz.state.FilialStateTracker;

public class ApiHandler {

	private static final Logger logger = Logger.getLogger(ApiHandler.class);

	private final ConfigManager configManager;
	private final FilialStateTracker stateTracker;
	private final LogCapture logCapture;
	private final PollingManager pollingManager;
	private int lastStatusCode = 200;

	public ApiHandler(ConfigManager configManager, FilialStateTracker stateTracker,
					  LogCapture logCapture, PollingManager pollingManager) {
		this.configManager = configManager;
		this.stateTracker = stateTracker;
		this.logCapture = logCapture;
		this.pollingManager = pollingManager;
	}

	public String handle(String method, String path, String body) {
		method = method.toUpperCase();
		path = path.split("\\?")[0];

		try {
			return switch (path) {
				case "/api/config" -> handleConfig(method, body);
				case "/api/status" -> handleStatus(method);
				case "/health"     -> handleHealth(method);
				case "/api/logs"   -> handleLogs(method);
				default -> LogHelper.jsonError(404, "Not found");
			};
		} catch (Exception e) {
			logger.error("ApiHandler: Error: {}", e.getMessage());
			return LogHelper.jsonError(500, "Internal server error");
		}
	}

	public int lastStatusCode() {
		return lastStatusCode;
	}

	private String handleConfig(String method, String body) {
		switch (method) {
			case "GET" -> {
				lastStatusCode = 200;
				return configManager.getConfigJson();
			}
			case "PUT" -> {
				if (body == null || body.isBlank()) {
					lastStatusCode = 400;
					return LogHelper.jsonError(400, "Empty body");
				}
				boolean ok = configManager.save(body);
				if (ok) {
					pollingManager.restart();
					lastStatusCode = 200;
					return "{\"status\":\"ok\"}";
				} else {
					lastStatusCode = 400;
					return LogHelper.jsonError(400, "Invalid config");
				}
			}
			case "OPTIONS" -> {
				lastStatusCode = 204;
				return "";
			}
			default -> {
				lastStatusCode = 405;
				return LogHelper.jsonError(405, "Method not allowed");
			}
		}
	}

	private String handleHealth(String method) {
		if ("GET".equals(method) || "OPTIONS".equals(method)) {
			var cfg = configManager.getConfig();
			String health = "{\"status\":\"ok\",\"filiais\":" + cfg.filiais().size()
				+ ",\"pollingMs\":" + cfg.pollingMs() + "}";
			lastStatusCode = 200;
			return health;
		}
		lastStatusCode = 405;
		return LogHelper.jsonError(405, "Method not allowed");
	}

	private String handleStatus(String method) {
		if ("GET".equals(method) || "OPTIONS".equals(method)) {
			lastStatusCode = 200;
			java.util.List<FilialInfo> filiais = configManager.getConfig().filiais();
			return stateTracker.getAllStates(filiais).toString();
		}
		lastStatusCode = 405;
		return LogHelper.jsonError(405, "Method not allowed");
	}

	private String handleLogs(String method) {
		if ("GET".equals(method) || "OPTIONS".equals(method)) {
			lastStatusCode = 200;
			return LogHelper.logsToJson(logCapture.getEntries(200));
		}
		lastStatusCode = 405;
		return LogHelper.jsonError(405, "Method not allowed");
	}
}
