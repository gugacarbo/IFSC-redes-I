package shared;

/**
 * Protocol constants matching the ESP32 C++ IoT system.
 *
 * <p>All JSON field names, command values, and error strings
 * are defined here to avoid magic strings throughout the codebase.
 */
public final class Protocol {

    private Protocol() {}

    // ---- Command identifiers ----

    public static final String CMD_LIST_REQ   = "list_req";
    public static final String CMD_LIST_RESP  = "list_resp";
    public static final String CMD_GET_STATUS = "get_status";
    public static final String CMD_GET_RESP   = "get_resp";
    public static final String CMD_SET_REQ    = "set_req";
    public static final String CMD_SET_RESP   = "set_resp";

    // ---- JSON field names ----

    public static final String FIELD_CMD    = "cmd";
    public static final String FIELD_USER   = "user";
    public static final String FIELD_PASS   = "pass";
    public static final String FIELD_ID     = "id";
    public static final String FIELD_VALUE  = "value";
    public static final String FIELD_ERROR  = "error";

    // ---- WS envelope fields (matriz ↔ GUI) ----

    public static final String WS_TYPE       = "type";
    public static final String WS_TX         = "ws_tx";
    public static final String WS_RX         = "ws_rx";
    public static final String WS_TARGET_IP  = "target_ip";
    public static final String WS_SOURCE_IP  = "source_ip";
    public static final String WS_PAYLOAD    = "payload";

    // ---- Error messages ----

    public static final String ERR_INVALID_JSON       = "Invalid JSON";
    public static final String ERR_MISSING_CREDENTIALS = "Missing credentials";
    public static final String ERR_UNAUTHORIZED       = "Unauthorized";
    public static final String ERR_MISSING_ID         = "Missing id";
    public static final String ERR_DEVICE_NOT_FOUND   = "Device not found";
    public static final String ERR_READ_ONLY          = "Read only";
    public static final String ERR_UNKNOWN_CMD        = "Unknown command";

    // ---- Defaults ----

    public static final int    DEFAULT_PORT = 51000;
    public static final int    DEFAULT_HTTP_PORT = 8082;
    public static final String DEFAULT_USER = "admin";
    public static final String DEFAULT_PASS = "admin";

    // ---- Device ID patterns ----

    private static final String LIGHT_MARKER = "_light_";
    private static final String SENSOR_PREFIX = "sensor_";
    private static final String ACTUATOR_PREFIX = "actuator_";

    /**
     * Returns true if the device ID represents a light (boolean) device.
     * Detection matches the C++ logic: id.indexOf("_light_") != -1
     */
    public static boolean isLight(String deviceId) {
        return deviceId != null && deviceId.contains(LIGHT_MARKER);
    }

    /**
     * Returns true if the device ID starts with "sensor_",
     * indicating a read-only device.
     */
    public static boolean isSensor(String deviceId) {
        return deviceId != null && deviceId.startsWith(SENSOR_PREFIX);
    }

    /**
     * Returns true if the device ID starts with "actuator_",
     * indicating a writable device.
     */
    public static boolean isActuator(String deviceId) {
        return deviceId != null && deviceId.startsWith(ACTUATOR_PREFIX);
    }

    // ---- Response builders ----

    /** Build a {@code cmd: "error"} JSON response. */
    public static Json.JsonObject errorResponse(String message) {
        return Json.object().put(FIELD_CMD, FIELD_ERROR).put(FIELD_ERROR, message);
    }

    /** Quick check: is this JSON object an error response? */
    public static boolean isError(Json.JsonObject obj) {
        return FIELD_ERROR.equals(obj.getString(FIELD_CMD, ""));
    }
}
