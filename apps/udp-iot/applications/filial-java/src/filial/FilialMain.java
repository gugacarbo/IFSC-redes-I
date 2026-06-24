package filial;

import filial.api.ApiHandler;
import filial.bridge.DeviceBridge;
import filial.config.ConfigManager;
import filial.gui.DeviceGui;
import filial.model.DeviceManager;
import filial.model.FilialConfig;
import filial.network.http.AppServer;
import filial.udp.CommandProcessor;
import filial.udp.UdpServer;
import lib.logging.Logger;
import shared.LogCapture;

import javax.swing.*;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.function.Consumer;

public class FilialMain {

    private static final Logger logger = Logger.getLogger(FilialMain.class);

    private static final String DEFAULT_CONFIG = "config/config_filial.json";
    private static final String NO_GUI_FLAG = "--no-gui";

    public static void main(String[] args) {
        boolean noGui = false;
        for (String arg : args) {
            if (NO_GUI_FLAG.equals(arg)) {
                noGui = true;
                break;
            }
        }

        logger.info("=== Filial IoT (Java) ===");

        ConfigManager cfgMgr = new ConfigManager();
        if (!cfgMgr.load(DEFAULT_CONFIG)) {
            logger.error("FATAL: Could not load config from {}", DEFAULT_CONFIG);
            System.exit(1);
        }
        FilialConfig cfg = cfgMgr.getConfig();

        int udpPort = cfg.port();
        int httpPort = cfg.httpPort();

        logger.info("UDP port: {}", udpPort);
        logger.info("HTTP/WS port: {}", httpPort);
        logger.info("Devices: {}", cfg.deviceIds().size());

        DeviceManager devMgr = new DeviceManager();
        devMgr.init(cfg.deviceIds());
        logger.info("Initialised {} devices", devMgr.count());

        DeviceBridge deviceBridge = new DeviceBridge(devMgr, cfgMgr);

        if (!noGui) {
            launchGui(devMgr, sensorId -> deviceBridge.broadcastDevicesUpdated(), udpPort);
        }

        LogCapture logCapture = new LogCapture(500);
        logCapture.install();
        logCapture.setBroadcastListener(json -> deviceBridge.broadcast(json));
        ApiHandler apiHandler = new ApiHandler(devMgr, deviceBridge, cfgMgr, logCapture);

        AppServer appServer = new AppServer(httpPort, deviceBridge, apiHandler);
        if (!appServer.start()) {
            logger.error("FATAL: Could not start HTTP/WS server on port {}", httpPort);
            System.exit(1);
        }
        logger.info("  REST API: http://localhost:{}/api/devices", httpPort);
        logger.info("  WebSocket: ws://localhost:{}/ws", httpPort);
        logger.info("  Health:   http://localhost:{}/health", httpPort);

        CommandProcessor processor = new CommandProcessor(
            devMgr,
            cfgMgr,
            deviceBridge::broadcastDevicesUpdated
        );
        UdpServer udpServer = new UdpServer(udpPort, processor);

        if (!udpServer.start()) {
            logger.error("FATAL: Could not bind UDP port {}", udpPort);
            System.exit(1);
        }

        logger.info("Listening on UDP port {}", udpPort);
        logger.info("Ready. Press Ctrl+C to stop.");

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("\nShutting down...");
            appServer.stop();
            udpServer.stop();
        }));

        try {
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static void launchGui(DeviceManager devMgr, Consumer<String> onSensorChanged, int udpPort) {
        logger.info("Starting desktop GUI...");
        String host;
        try {
            host = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            host = "localhost";
        }
        final String resolvedHost = host;
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
            }
            DeviceGui gui = new DeviceGui(devMgr, onSensorChanged, resolvedHost, udpPort);
            gui.setVisible(true);
        });
    }
}
