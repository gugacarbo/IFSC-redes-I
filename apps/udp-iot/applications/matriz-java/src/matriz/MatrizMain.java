package matriz;

import lib.logging.Logger;
import shared.Env;
import shared.LogCapture;
import matriz.api.ApiHandler;
import matriz.bridge.BridgeManager;
import matriz.bridge.PollingManager;
import matriz.config.ConfigManager;
import matriz.model.MatrizConfig;
import matriz.network.http.AppServer;
import matriz.network.udp.UdpClient;
import matriz.network.ws.WebSocketHandshake;
import matriz.state.FilialStateTracker;

public class MatrizMain {

	private static final String DEFAULT_CONFIG = "config/config_matriz.json";
	private static final Logger logger = Logger.getLogger(MatrizMain.class);

	public static void main(String[] args) {
		Env.load();

		String configPath = args.length > 0 ? args[0] : DEFAULT_CONFIG;
		int httpPort = Env.getInt("MATRIZ_HTTP_PORT", 8080);

		logger.info("=== Matriz IoT (Java) ===");
		logger.info("Config: {}", configPath);

		LogCapture logCapture = new LogCapture(500);
		logCapture.install();

		logger.info("HTTP/WS port: {} (via .env)", httpPort);

		ConfigManager configManager = new ConfigManager();
		if (!configManager.load(configPath)) {
			logger.error("FATAL: Could not load config from {}", configPath);
			System.exit(1);
		}
		MatrizConfig cfg = configManager.getConfig();
		logger.info("Filiais configured: {}", cfg.filiais().size());
		logger.info("Polling interval: {}ms", cfg.pollingMs());

		UdpClient udpClient = new UdpClient();

		BridgeManager bridgeManager = new BridgeManager(configManager, udpClient);
		logCapture.setBroadcastListener(json -> bridgeManager.broadcast(json));

		FilialStateTracker stateTracker = new FilialStateTracker();

		PollingManager pollingManager = new PollingManager(configManager, udpClient,
			bridgeManager, stateTracker);

		ApiHandler apiHandler = new ApiHandler(configManager, stateTracker, logCapture, pollingManager);

		WebSocketHandshake handshake = new WebSocketHandshake();

		AppServer appServer = new AppServer(httpPort, bridgeManager, apiHandler, handshake);
		if (!appServer.start()) {
			logger.error("FATAL: Could not start HTTP/WS server on port {}", httpPort);
			System.exit(1);
		}
		logger.info("HTTP + WebSocket server on port {}", httpPort);
		logger.info("  REST API: http://localhost:{}/api/config", httpPort);
		logger.info("  Status:   http://localhost:{}/api/status", httpPort);
		logger.info("  WebSocket: ws://localhost:{}/ws", httpPort);
		logger.info("  Health:   http://localhost:{}/health", httpPort);

		pollingManager.start();

		Runtime.getRuntime().addShutdownHook(new Thread(() -> {
			logger.info("Shutting down...");
			pollingManager.stop();
			appServer.stop();
		}));

		logger.info("Ready. Press Ctrl+C to stop.");

		try {
			Thread.sleep(Long.MAX_VALUE);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}
}
