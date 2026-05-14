package filial;

import lib.logging.Logger;
import javax.swing.*;
import java.util.function.Consumer;
import shared.Env;
import shared.LogCapture;

/**
 * Entry point for the Filial (branch) application.
 *
 * <p>Initialises all components:
 * <ol>
 *   <li>Loads configuration</li>
 *   <li>Creates DeviceBridge (needed by GUI callback)</li>
 *   <li>Launches desktop GUI for sensor simulation</li>
 *   <li>Starts the UDP server for Matriz communication</li>
 *   <li>Starts the HTTP + WebSocket server (REST API + GUI connections)</li>
 *   <li>Blocks indefinitely</li>
 * </ol>
 *
 * <p>Use {@code --no-gui} to run without the desktop GUI.
 */
public class FilialMain {

    private static final Logger logger = Logger.getLogger(FilialMain.class);

    private static final String DEFAULT_CONFIG = "config/config_filial.json";
    private static final String NO_GUI_FLAG = "--no-gui";

    public static void main(String[] args) {
        Env.load();

        // Check for no-gui mode
        boolean noGui = false;
        for (String arg : args) {
            if (NO_GUI_FLAG.equals(arg)) {
                noGui = true;
                break;
            }
        }

        logger.info("=== Filial IoT (Java) ===");

        // 1. Load config
        ConfigManager cfgMgr = new ConfigManager();
        if (!cfgMgr.load(DEFAULT_CONFIG)) {
            logger.error("FATAL: Could not load config from {}", DEFAULT_CONFIG);
            System.exit(1);
        }
        FilialConfig cfg = cfgMgr.getConfig();

        int udpPort = Env.getInt("FILIAL_UDP_PORT", cfg.port());
        int httpPort = Env.getInt("FILIAL_HTTP_PORT", cfg.httpPort());

        logger.info("UDP port: {}", udpPort);
        logger.info("HTTP/WS port: {}", httpPort);
        logger.info("Devices: {}", cfg.deviceIds().size());

        // 2. Initialise device manager
        DeviceManager devMgr = new DeviceManager();
        devMgr.init(cfg.deviceIds());
        logger.info("Initialised {} devices", devMgr.count());

        // 3. Create bridge (needed by GUI callback and API handler)
        DeviceBridge deviceBridge = new DeviceBridge(devMgr, cfgMgr);

        // 4. Launch GUI (if not disabled)
        if (!noGui) {
            launchGui(devMgr, sensorId -> deviceBridge.broadcastDevicesUpdated());
        }

        // 5. Log stdout to GUI console
        LogCapture logCapture = new LogCapture(500);
        logCapture.install();
        logCapture.setBroadcastListener(json -> deviceBridge.broadcast(json));
        ApiHandler apiHandler = new ApiHandler(devMgr, deviceBridge, logCapture);

        // 6. Start HTTP + WebSocket server
        AppServer appServer = new AppServer(httpPort, deviceBridge, apiHandler);
        if (!appServer.start()) {
            logger.error("FATAL: Could not start HTTP/WS server on port {}", httpPort);
            System.exit(1);
        }
        logger.info("  REST API: http://localhost:{}/api/devices", httpPort);
        logger.info("  WebSocket: ws://localhost:{}/ws", httpPort);
        logger.info("  Health:   http://localhost:{}/health", httpPort);

        // 7. Start UDP server for Matriz
        CommandProcessor processor = new CommandProcessor(
            devMgr,
            cfg.adminUser(),
            cfg.adminPass(),
            deviceBridge::broadcastDevicesUpdated
        );
        UdpServer udpServer = new UdpServer(udpPort, processor);

        if (!udpServer.start()) {
            logger.error("FATAL: Could not bind UDP port {}", udpPort);
            System.exit(1);
        }

        logger.info("Listening on UDP port {}", udpPort);
        logger.info("Ready. Press Ctrl+C to stop.");

        // 8. Shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("\nShutting down...");
            appServer.stop();
            udpServer.stop();
        }));

        // 9. Keep alive
        try {
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Launch the desktop GUI simulation in a separate thread.
     */
    private static void launchGui(DeviceManager devMgr, Consumer<String> onSensorChanged) {
        logger.info("Starting desktop GUI...");
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                // Use default look and feel
            }
            DeviceGui gui = new DeviceGui(devMgr, onSensorChanged);
            gui.setVisible(true);
        });
    }
}
