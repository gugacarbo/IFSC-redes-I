package filial.udp;

import filial.model.DeviceManager;
import filial.model.DeviceState;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import shared.Protocol;

import java.util.Map;

public class CommandHandlers {

    private final DeviceManager deviceManager;

    public CommandHandlers(DeviceManager deviceManager) {
        this.deviceManager = deviceManager;
    }

    public String handleListReq() {
        JsonArray ids = new JsonArray();
        for (String id : deviceManager.list()) {
            ids.add(id);
        }
        return new JsonObject()
            .put(Protocol.FIELD_CMD, Protocol.CMD_LIST_RESP)
            .put(Protocol.FIELD_ID, ids)
            .toString();
    }

    public String handleGetStatus() {
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

    public String handleSetReq(JsonObject req) {
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

    private boolean parseLightBoolean(JsonObject req) {
        try {
            return req.getBoolean(Protocol.FIELD_VALUE);
        } catch (Exception ignored) {
        }

        try {
            int numeric = req.getInt(Protocol.FIELD_VALUE);
            return numeric != 0;
        } catch (Exception ignored) {
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
