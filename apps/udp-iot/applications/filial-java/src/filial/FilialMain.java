package filial;

import shared.Env;
import shared.LogCapture;

/**
 * Entry point for the Filial (branch) application.
 *
 * <p>Initialises all components:
 * <ol>
 *   <li>Loads configuration</li>
 *   <li>Starts the UDP server for Matriz communication</li>
 *   <li>Creates DeviceBridge + ApiHandler for GUI WebSocket</li>
 *   <li>Starts the HTTP + WebSocket server (REST API + GUI connections)</li>
 *   <li>Blocks indefinitely</li>
 * </ol>
 */
public class FilialMain {

    private static final String DEFAULT_CONFIG = "config/config_filial.json";

    public static void main(String[] args) {
        Env.load();

        String configPath = args.length > 0 ? args[0] : DEFAULT_CONFIG;
        int envPort = Env.getInt("FILIAL_UDP_PORT", -1);
        int envHttpPort = Env.getInt("FILIAL_HTTP_PORT", -1);

        System.out.println("=== Filial IoT (Java) ===");
        System.out.println("Config: " + configPath);

        // === Log stdout to GUI console ===
        LogCapture logCapture = new LogCapture(500);
        logCapture.install();

        // 1. Load config
        ConfigManager cfgMgr = new ConfigManager();
        if (!cfgMgr.load(configPath)) {
            System.err.println("FATAL: Could not load config from " + configPath);
            System.exit(1);
        }
        FilialConfig cfg = cfgMgr.getConfig();

        int udpPort = (envPort > 0) ? envPort : cfg.port();
        int httpPort = (envHttpPort > 0) ? envHttpPort : cfg.httpPort();

        System.out.println("UDP port: " + udpPort + (envPort > 0 ? " (via .env)" : ""));
        System.out.println("HTTP/WS port: " + httpPort + (envHttpPort > 0 ? " (via .env)" : ""));
        System.out.println("Devices: " + cfg.deviceIds().size());

        // 2. Initialise device manager
        DeviceManager devMgr = new DeviceManager();
        devMgr.init(cfg.deviceIds());
        System.out.println("Initialised " + devMgr.count() + " devices");

        // 3. Create bridge and API handler
        DeviceBridge deviceBridge = new DeviceBridge(devMgr, cfgMgr);
        logCapture.setBroadcastListener(json -> deviceBridge.broadcast(json));
        ApiHandler apiHandler = new ApiHandler(devMgr, deviceBridge, logCapture);

        // 4. Start HTTP + WebSocket server
        AppServer appServer = new AppServer(httpPort, deviceBridge, apiHandler);
        if (!appServer.start()) {
            System.err.println("FATAL: Could not start HTTP/WS server on port " + httpPort);
            System.exit(1);
        }
        System.out.println("  REST API: http://localhost:" + httpPort + "/api/devices");
        System.out.println("  WebSocket: ws://localhost:" + httpPort + "/ws");
        System.out.println("  Health:   http://localhost:" + httpPort + "/health");

        // 5. Start UDP server for Matriz
        CommandProcessor processor = new CommandProcessor(devMgr, cfg.adminUser(), cfg.adminPass());
        UdpServer udpServer = new UdpServer(udpPort, processor);

        if (!udpServer.start()) {
            System.err.println("FATAL: Could not bind UDP port " + udpPort);
            System.exit(1);
        }

        System.out.println("Listening on UDP port " + udpPort);
        System.out.println("Ready. Press Ctrl+C to stop.");

        // 6. Shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nShutting down...");
            appServer.stop();
            udpServer.stop();
        }));

        // 7. Keep alive
        try {
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
