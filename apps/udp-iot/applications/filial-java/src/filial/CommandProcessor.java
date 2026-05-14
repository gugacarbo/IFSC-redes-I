package filial;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import shared.Protocol;

import java.util.Map;

/**
 * Processes incoming UDP commands and produces responses.
 *
 * <p>Replaces command routing logic from {@code filial-esp32/UdpServer.cpp}.
 *
 * <p>Flow for every incoming datagram:
 * <ol>
 *   <li>Parse JSON</li>
 *   <li>Authenticate (user/pass against configured admin credentials)</li>
 *   <li>Route command to handler</li>
 *   <li>Return response JSON</li>
 * </ol>
 */
public class CommandProcessor {

    private final DeviceManager deviceManager;
    private final String adminUser;
    private final String adminPass;
    private final Runnable onDevicesChanged;

    public CommandProcessor(DeviceManager deviceManager, String adminUser, String adminPass) {
        this(deviceManager, adminUser, adminPass, null);
    }

    public CommandProcessor(
        DeviceManager deviceManager,
        String adminUser,
        String adminPass,
        Runnable onDevicesChanged
    ) {
        this.deviceManager = deviceManager;
        this.adminUser = adminUser;
        this.adminPass = adminPass;
        this.onDevicesChanged = onDevicesChanged;
    }

    /**
     * Process a single JSON command string and return a JSON response.
     *
     * @param requestJson the raw JSON string received via UDP
     * @return JSON response string, or null if no response needed
     */
    public String process(String requestJson) {
        // 1. Parse JSON
        JsonObject req;
        try {
            req = Json.parseObject(requestJson);
        } catch (Exception e) {
            return Protocol.errorResponse(Protocol.ERR_INVALID_JSON).toString();
        }

        // 2. Extract credentials
        String user = req.getString(Protocol.FIELD_USER, "");
        String pass = req.getString(Protocol.FIELD_PASS, "");
        if (user.isEmpty() || pass.isEmpty()) {
            return Protocol.errorResponse(Protocol.ERR_MISSING_CREDENTIALS).toString();
        }

        // 3. Authenticate
        if (!user.equals(adminUser) || !pass.equals(adminPass)) {
            return Protocol.errorResponse(Protocol.ERR_UNAUTHORIZED).toString();
        }

        // 4. Route command
        String cmd = req.getString(Protocol.FIELD_CMD, "");
        return switch (cmd) {
            case Protocol.CMD_LIST_REQ   -> handleListReq();
            case Protocol.CMD_GET_STATUS -> handleGetStatus();
            case Protocol.CMD_SET_REQ    -> handleSetReq(req);
            default -> Protocol.errorResponse(Protocol.ERR_UNKNOWN_CMD).toString();
        };
    }

    // ---- Command handlers ----

    /** Handle {@code list_req}: return all device IDs. */
    private String handleListReq() {
        JsonArray ids = new JsonArray();
        for (String id : deviceManager.list()) {
            ids.add(id);
        }
        return new JsonObject()
            .put(Protocol.FIELD_CMD, Protocol.CMD_LIST_RESP)
            .put(Protocol.FIELD_ID, ids)
            .toString();
    }

    /** Handle {@code get_status}: return all device states as key-value pairs. */
    private String handleGetStatus() {
        JsonObject resp = new JsonObject();
        resp.put(Protocol.FIELD_CMD, Protocol.CMD_GET_RESP);

        for (Map.Entry<String, DeviceState> entry : deviceManager.getAll().entrySet()) {
            String deviceId = entry.getKey();
            DeviceState state = entry.getValue();
            if (state.isLight()) {
                resp.put(deviceId, state.boolValue());
            } else {
                resp.put(deviceId, state.intValue());
            }
        }
        return resp.toString();
    }

    /** Handle {@code set_req}: set a device value. */
    private String handleSetReq(JsonObject req) {
        // Must have an "id" field
        if (!req.has(Protocol.FIELD_ID)) {
            return Protocol.errorResponse(Protocol.ERR_MISSING_ID).toString();
        }

        String deviceId = req.getString(Protocol.FIELD_ID);
        DeviceState state = deviceManager.get(deviceId);

        if (state == null) {
            return Protocol.errorResponse(Protocol.ERR_DEVICE_NOT_FOUND).toString();
        }

        if (state.isSensor()) {
            return Protocol.errorResponse(Protocol.ERR_READ_ONLY).toString();
        }

		// Determine value type from device type
		try {
			if (state.isLight()) {
				boolean value = parseLightBoolean(req);
				deviceManager.set(deviceId, value);
			} else {
				int value = req.getInt(Protocol.FIELD_VALUE);
				deviceManager.set(deviceId, value);
			}
        } catch (Exception e) {
            return Protocol.errorResponse("Invalid value: " + e.getMessage()).toString();
        }

        if (onDevicesChanged != null) {
            onDevicesChanged.run();
        }

        // Build set_resp with the new value
        DeviceState updated = deviceManager.get(deviceId);
        JsonObject resp = new JsonObject();
        resp.put(Protocol.FIELD_CMD, Protocol.CMD_SET_RESP);
        resp.put(Protocol.FIELD_ID, deviceId);
        if (updated.isLight()) {
            resp.put(Protocol.FIELD_VALUE, updated.boolValue());
        } else {
            resp.put(Protocol.FIELD_VALUE, updated.intValue());
        }
		return resp.toString();
	}

	/**
	 * Parse boolean command values for light devices with tolerant inputs.
	 *
	 * Accepts:
	 * - JSON boolean: true/false
	 * - JSON number: 0/1
	 * - JSON string: "true"/"false"/"1"/"0"/"on"/"off"
	 */
	private boolean parseLightBoolean(JsonObject req) {
		try {
			return req.getBoolean(Protocol.FIELD_VALUE);
		} catch (Exception ignored) {
			// Fall through to permissive parsing below
		}

		try {
			int numeric = req.getInt(Protocol.FIELD_VALUE);
			return numeric != 0;
		} catch (Exception ignored) {
			// Fall through to string parsing below
		}

		String raw = req.getString(Protocol.FIELD_VALUE, "").trim().toLowerCase();
		if (raw.equals("true") || raw.equals("1") || raw.equals("on")) {
			return true;
		}
		if (raw.equals("false") || raw.equals("0") || raw.equals("off")) {
			return false;
		}

		throw new IllegalArgumentException("invalid boolean value: '" + raw + "'");
	}
}
