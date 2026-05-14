package matriz;

import shared.Env;
import shared.LogCapture;

/**
 * Entry point for the Matriz (headquarters) application.
 *
 * <p>Replaces {@code matriz-esp32/main.cpp}.
 *
 * <p>Initialises all components:
 * <ol>
 *   <li>Loads configuration from {@code config/config_matriz.json}</li>
 *   <li>Starts the UDP client for filial communication</li>
 *   <li>Starts the BridgeManager (WebSocket ↔ UDP bridge)</li>
 *   <li>Creates the {@link FilialStateTracker} for internal state (GUI-independent)</li>
 *   <li>Starts the HTTP + WebSocket server (REST API + GUI connections)</li>
 *   <li>Starts the polling manager for periodic filial updates (feeds the tracker)</li>
 *   <li>Blocks indefinitely</li>
 * </ol>
 *
 * <p>Usage:
 * <pre>
 *   java matriz.MatrizMain [config_path]
 * </pre>
 *
 * <p>Ports are configured via {@code .env}:
 * <ul>
 *   <li>{@code MATRIZ_HTTP_PORT} — HTTP + WebSocket port (default: 8080)</li>
 * </ul>
 */
public class MatrizMain {

    private static final String DEFAULT_CONFIG = "config/config_matriz.json";

    public static void main(String[] args) {
        // Load .env before anything else
        Env.load();

        String configPath = args.length > 0 ? args[0] : DEFAULT_CONFIG;
        int httpPort = Env.getInt("MATRIZ_HTTP_PORT", 8080);

        System.out.println("=== Matriz IoT (Java) ===");
        System.out.println("Config: " + configPath);

        // === Log stdout to GUI console ===
        LogCapture logCapture = new LogCapture(500);
        logCapture.install();

        System.out.println("HTTP/WS port: " + httpPort + " (via .env)");

        // 1. Load configuration
        ConfigManager configManager = new ConfigManager();
        if (!configManager.load(configPath)) {
            System.err.println("FATAL: Could not load config from " + configPath);
            System.exit(1);
        }
        ConfigManager.MatrizConfig cfg = configManager.getConfig();
        System.out.println("Filiais configured: " + cfg.filiais().size());
        System.out.println("Polling interval: " + cfg.pollingMs() + "ms");

        // 2. Create UDP client
        UdpClient udpClient = new UdpClient();

        // 3. Create BridgeManager (WS ↔ UDP bridge)
        BridgeManager bridgeManager = new BridgeManager(configManager, udpClient);
        logCapture.setBroadcastListener(json -> bridgeManager.broadcast(json));

        // 4. Create FilialStateTracker (internal state, independent of GUI)
        FilialStateTracker stateTracker = new FilialStateTracker();

        // 5. Create PollingManager (before ApiHandler so we can inject it)
        PollingManager pollingManager = new PollingManager(configManager, udpClient,
            bridgeManager, stateTracker);

        // 6. Create API handler (needs pollingManager to restart on config changes)
        ApiHandler apiHandler = new ApiHandler(configManager, stateTracker, logCapture, pollingManager);

        // 7. Start HTTP + WebSocket server
        AppServer appServer = new AppServer(httpPort, bridgeManager, apiHandler);
        if (!appServer.start()) {
            System.err.println("FATAL: Could not start HTTP/WS server on port " + httpPort);
            System.exit(1);
        }
        System.out.println("HTTP + WebSocket server on port " + httpPort);
        System.out.println("  REST API: http://localhost:" + httpPort + "/api/config");
        System.out.println("  Status:   http://localhost:" + httpPort + "/api/status");
        System.out.println("  WebSocket: ws://localhost:" + httpPort + "/ws");
        System.out.println("  Health:   http://localhost:" + httpPort + "/health");

        // 8. Start polling (updates FilialStateTracker independently of GUI)
        pollingManager.start();

        // 9. Shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nShutting down...");
            pollingManager.stop();
            appServer.stop();
        }));

        System.out.println("Ready. Press Ctrl+C to stop.");

        // 8. Keep alive
        try {
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
