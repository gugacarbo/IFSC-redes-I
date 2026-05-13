package filial;

import shared.Env;
import shared.Json;
import shared.Protocol;

/**
 * Entry point for the Filial (branch) application.
 *
 * <p>Replaces {@code filial-esp32/main.cpp}.
 * Loads configuration, initialises device manager and UDP server,
 * then blocks indefinitely.
 *
 * <p>Usage:
 * <pre>
 *   java filial.FilialMain [config_path]
 * </pre>
 * Default config path is {@code config/config_filial.json}.
 *
 * <p>Port may be overridden via {@code .env}:
 * <ul>
 *   <li>{@code FILIAL_UDP_PORT} — overrides the port in the config file (default: 51000)</li>
 * </ul>
 */
public class FilialMain {

    private static final String DEFAULT_CONFIG = "config/config_filial.json";

    public static void main(String[] args) {
        // Load .env before anything else
        Env.load();

        String configPath = args.length > 0 ? args[0] : DEFAULT_CONFIG;
        int envPort = Env.getInt("FILIAL_UDP_PORT", -1);

        System.out.println("=== Filial IoT (Java) ===");
        System.out.println("Config: " + configPath);

        // 1. Load config
        ConfigManager cfgMgr = new ConfigManager();
        if (!cfgMgr.load(configPath)) {
            System.err.println("FATAL: Could not load config from " + configPath);
            System.exit(1);
        }
        FilialConfig cfg = cfgMgr.getConfig();

        // .env FILIAL_UDP_PORT overrides config file port
        int udpPort = (envPort > 0) ? envPort : cfg.port();

        System.out.println("Port: " + udpPort + (envPort > 0 ? " (via .env)" : ""));
        System.out.println("Devices: " + cfg.deviceIds().size());

        // 2. Initialise device manager with all device IDs from config
        DeviceManager devMgr = new DeviceManager();
        devMgr.init(cfg.deviceIds());
        System.out.println("Initialised " + devMgr.count() + " devices");

        // 3. Start UDP server
        CommandProcessor processor = new CommandProcessor(devMgr, cfg.adminUser(), cfg.adminPass());
        UdpServer server = new UdpServer(udpPort, processor);

        if (!server.start()) {
            System.err.println("FATAL: Could not bind UDP port " + udpPort);
            System.exit(1);
        }

        System.out.println("Listening on UDP port " + udpPort);
        System.out.println("Ready. Press Ctrl+C to stop.");

        // 4. Keep alive
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nShutting down...");
            server.stop();
        }));

        // Sleep main thread indefinitely
        try {
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
        String configPath;
        if (args.length > 0) {
            configPath = args[0];
        } else {
            // CLI env var > .env file > default
            configPath = Env.get("FILIAL_CONFIG_PATH", DEFAULT_CONFIG);
        }
