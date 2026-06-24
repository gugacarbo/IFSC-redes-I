package filial.udp;

import filial.config.ConfigManager;
import filial.model.DeviceManager;
import filial.model.FilialConfig;
import shared.Json;
import shared.Json.JsonObject;
import shared.Protocol;

public class CommandProcessor {

    private final DeviceManager deviceManager;
    private final ConfigManager configManager;
    private final CommandHandlers handlers;
    private final Runnable onDevicesChanged;

    public CommandProcessor(DeviceManager deviceManager, ConfigManager configManager) {
        this(deviceManager, configManager, null);
    }

    public CommandProcessor(
        DeviceManager deviceManager,
        ConfigManager configManager,
        Runnable onDevicesChanged
    ) {
        this.deviceManager = deviceManager;
        this.configManager = configManager;
        this.handlers = new CommandHandlers(deviceManager);
        this.onDevicesChanged = onDevicesChanged;
    }

    public String process(String requestJson) {
        JsonObject req;
        try {
            req = Json.parseObject(requestJson);
        } catch (Exception e) {
            return Protocol.errorResponse(Protocol.ERR_INVALID_JSON).toString();
        }

        String user = req.getString(Protocol.FIELD_USER, "");
        String pass = req.getString(Protocol.FIELD_PASS, "");
        if (user.isEmpty() || pass.isEmpty()) {
            return Protocol.errorResponse(Protocol.ERR_MISSING_CREDENTIALS).toString();
        }

        FilialConfig cfg = configManager.getConfig();
        if (!user.equals(cfg.adminUser()) || !pass.equals(cfg.adminPass())) {
            return Protocol.errorResponse(Protocol.ERR_UNAUTHORIZED).toString();
        }

        String cmd = req.getString(Protocol.FIELD_CMD, "");
        return switch (cmd) {
            case Protocol.CMD_LIST_REQ   -> handlers.handleListReq();
            case Protocol.CMD_GET_STATUS -> handlers.handleGetStatus();
            case Protocol.CMD_SET_REQ    -> handlers.handleSetReq(req);
            default -> Protocol.errorResponse(Protocol.ERR_UNKNOWN_CMD).toString();
        };
    }
}
