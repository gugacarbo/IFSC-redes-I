package matriz;
import lib.logging.Logger;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import shared.Protocol;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Periodically polls all configured filiais and broadcasts results
 * to connected WebSocket GUI clients.
 *
 * <p>Replaces the polling logic in {@code matriz-esp32/BridgeManager.loop()}.
 *
 * <p>At each polling cycle, sends {@code list_req} and {@code get_status}
 * to every configured filial sequentially, wraps responses in
 * {@code ws_rx} envelopes, and broadcasts them.
 */
public class PollingManager {

    private static final Logger logger = Logger.getLogger(PollingManager.class);

    private final ConfigManager configManager;
    private final UdpClient udpClient;
    private final BridgeManager bridgeManager;
    private final FilialStateTracker stateTracker;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private ScheduledExecutorService scheduler;

    private static final int UDP_TIMEOUT_MS = 2000;

    /**
     * @param configManager provides filial list and credentials
     * @param udpClient     for sending UDP commands
     * @param bridgeManager for broadcasting results to GUI
     * @param stateTracker  for maintaining internal filial state (independent of GUI)
     */
    public PollingManager(ConfigManager configManager, UdpClient udpClient,
                          BridgeManager bridgeManager,
                          FilialStateTracker stateTracker) {
       this.configManager = configManager;
       this.udpClient = udpClient;
       this.bridgeManager = bridgeManager;
       this.stateTracker = stateTracker;
   }

    /** Restart polling with current config (call after config changes). */
    public synchronized void restart() {
        stop();
        start();
    }

    /** Start the polling loop. */
    public void start() {
        if (running.getAndSet(true)) return;

        ConfigManager.MatrizConfig cfg = configManager.getConfig();
        if (cfg.pollingMs() <= 0) {
            logger.info("Polling: Disabled (polling_ms = 0)");
            running.set(false);
            return;
        }

        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "polling-manager");
            t.setDaemon(true);
            return t;
        });

        scheduler.scheduleAtFixedRate(
            this::pollCycle,
            1000,                   // initial delay
            cfg.pollingMs(),        // period
            TimeUnit.MILLISECONDS
        );

        logger.info("Polling: Started (interval={}ms, {} filiais)", cfg.pollingMs(), cfg.filiais().size());
    }

    /** Stop the polling loop. */
    public void stop() {
        running.set(false);
        if (scheduler != null) {
            scheduler.shutdown();
        }
    }

    /** Check if polling is active. */
    public boolean isRunning() {
        return running.get();
    }

    // ---- Internal ----

    private void pollCycle() {
        ConfigManager.MatrizConfig cfg;
        try {
            cfg = configManager.getConfig();
        } catch (Exception e) {
            return;
        }

        if (cfg.filiais().isEmpty()) {
            return; // nothing to poll
        }

        for (FilialInfo filial : cfg.filiais()) {
            pollFilial(filial, cfg);
        }
    }

    /**
     * Poll a single filial: send list_req + get_status, broadcast responses.
     */
    private void pollFilial(FilialInfo filial, ConfigManager.MatrizConfig cfg) {
        String ip = filial.ip();
        int port = filial.port();

        try {
            // 1. Send list_req
            String listReq = new JsonObject()
                .put(Protocol.FIELD_CMD, Protocol.CMD_LIST_REQ)
                .put(Protocol.FIELD_USER, cfg.user())
                .put(Protocol.FIELD_PASS, cfg.pass())
                .toString();

            String listResp = udpClient.sendAndReceive(ip, port, listReq, UDP_TIMEOUT_MS);
            if (listResp != null) {
                // Update tracker — filial responded
                stateTracker.markContacted(ip);

                JsonObject envelope = new JsonObject();
                envelope.put(Protocol.WS_TYPE, Protocol.WS_RX);
                envelope.put(Protocol.WS_SOURCE_IP, ip);
                try {
                    envelope.put(Protocol.WS_PAYLOAD, Json.parseObject(listResp));
                } catch (Exception e) {
                    envelope.put(Protocol.WS_PAYLOAD, listResp);
                }
                bridgeManager.broadcast(envelope.toString());
            }

            // 2. Send get_status
            String getReq = new JsonObject()
                .put(Protocol.FIELD_CMD, Protocol.CMD_GET_STATUS)
                .put(Protocol.FIELD_USER, cfg.user())
                .put(Protocol.FIELD_PASS, cfg.pass())
                .toString();

            String getResp = udpClient.sendAndReceive(ip, port, getReq, UDP_TIMEOUT_MS);
            if (getResp != null) {
                // Update tracker with full device state
                try {
                    JsonObject parsed = Json.parseObject(getResp);
                    stateTracker.updateDeviceState(ip, parsed);
                } catch (Exception e) {
                    // Response isn't valid JSON — still mark as contacted
                    stateTracker.markContacted(ip);
                }

                JsonObject envelope = new JsonObject();
                envelope.put(Protocol.WS_TYPE, Protocol.WS_RX);
                envelope.put(Protocol.WS_SOURCE_IP, ip);
                try {
                    envelope.put(Protocol.WS_PAYLOAD, Json.parseObject(getResp));
                } catch (Exception e) {
                    envelope.put(Protocol.WS_PAYLOAD, getResp);
                }
                bridgeManager.broadcast(envelope.toString());
            }

        } catch (Exception e) {
            logger.error("Polling: Error polling {}", filial.displayString()
                , e.getMessage());
        }
    }
}
