package matriz;

import shared.Json;
import shared.Json.JsonObject;
import shared.Json.JsonValue;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks runtime state of all filiais based on polling results.
 *
 * <p>Updated by {@link PollingManager} on every poll cycle,
 * independently of whether a GUI client is connected.
 *
 * <p>Stores the latest device readings (from {@code get_resp}) per filial
 * and tracks online/offline status based on {@code lastSeen} timestamps.
 *
 * <p>Used by {@link ApiHandler} to serve {@code GET /api/status}.
 */
public class FilialStateTracker {

    /** Latest {@code get_resp} JSON per filial IP. */
    private final ConcurrentHashMap<String, JsonObject> deviceStates = new ConcurrentHashMap<>();

    /** Timestamp of last successful contact (epoch millis) per filial IP. */
    private final ConcurrentHashMap<String, Long> lastSeen = new ConcurrentHashMap<>();

    /** A filial is considered online if it responded within this window. */
    static final long ONLINE_TIMEOUT_MS = 15_000;

    // ---------------------------------------------------------------
    //  Mutation (called by PollingManager)
    // ---------------------------------------------------------------

    /**
     * Record a successful contact with a filial.
     * Updates {@code lastSeen} and stores the device state snapshot.
     *
     * @param ip    filial IP address
     * @param state the parsed {@code get_resp} JSON object (may contain
     *              device fields like {@code actuator_light_sala: true})
     */
    public void updateDeviceState(String ip, JsonObject state) {
        deviceStates.put(ip, state);
        lastSeen.put(ip, System.currentTimeMillis());
    }

    /**
     * Record a successful contact without device state
     * (e.g. after a {@code list_req} response).
     */
    public void markContacted(String ip) {
        lastSeen.put(ip, System.currentTimeMillis());
    }

    // ---------------------------------------------------------------
    //  Query (called by ApiHandler and BridgeManager)
    // ---------------------------------------------------------------

    /** Get the latest device state for a filial, or null if never polled. */
    public JsonObject getDeviceState(String ip) {
        return deviceStates.get(ip);
    }

    /** Get timestamp of last successful contact, or 0 if never contacted. */
    public long getLastSeen(String ip) {
        return lastSeen.getOrDefault(ip, 0L);
    }

    /**
     * Whether a filial is considered online (responded within
     * {@link #ONLINE_TIMEOUT_MS}).
     */
    public boolean isOnline(String ip) {
        Long seen = lastSeen.get(ip);
        if (seen == null) return false;
        return (System.currentTimeMillis() - seen) < ONLINE_TIMEOUT_MS;
    }

    // ---------------------------------------------------------------
    //  Bulk export (for REST API)
    // ---------------------------------------------------------------

    /**
     * Build a complete status JSON object for all configured filiais.
     *
     * <p>Output shape:
     * <pre>
     * {
     *   "192.168.1.10": {
     *     "name": "Filial A",
     *     "ip": "192.168.1.10",
     *     "port": 51000,
     *     "online": true,
     *     "lastSeen": 1712345678000,
     *     "devices": {
     *       "actuator_light_sala": true,
     *       "sensor_light_sala": false
     *     }
     *   },
     *   ...
     * }
     * </pre>
     *
     * @param filiais the configured filial list (provides name/port)
     */
    public JsonObject getAllStates(List<FilialInfo> filiais) {
        JsonObject result = new JsonObject();

        for (FilialInfo filial : filiais) {
            result.put(filial.ip(), buildFilialStatus(filial));
        }

        return result;
    }

    /** Build the status entry for a single filial. */
    private JsonObject buildFilialStatus(FilialInfo filial) {
        long now = System.currentTimeMillis();
        long seen = lastSeen.getOrDefault(filial.ip(), 0L);
        boolean online = seen > 0 && (now - seen) < ONLINE_TIMEOUT_MS;

        JsonObject entry = new JsonObject();
        entry.put("name", filial.name());
        entry.put("ip", filial.ip());
        entry.put("port", filial.port());
        entry.put("online", online);
        entry.put("lastSeen", seen);
        entry.put("devices", extractDevices(filial.ip()));
        return entry;
    }

    /** Extract device fields from stored state, stripping protocol fields. */
    private JsonObject extractDevices(String ip) {
        JsonObject raw = deviceStates.get(ip);
        if (raw == null) return new JsonObject();

        JsonObject devices = new JsonObject();
        for (Map.Entry<String, JsonValue> entry : raw.entries()) {
            String key = entry.getKey();
            // Skip protocol/internal fields
            if ("cmd".equals(key) || "user".equals(key)
                || "pass".equals(key) || "error".equals(key)) {
                continue;
            }
            devices.put(key, entry.getValue());
        }
        return devices;
    }
}
