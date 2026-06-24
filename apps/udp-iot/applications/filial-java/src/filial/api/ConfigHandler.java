package filial.api;

import filial.config.ConfigManager;
import filial.model.DeviceManager;
import filial.model.FilialConfig;
import shared.Json;
import shared.Json.JsonObject;

public class ConfigHandler {

    private final ConfigManager configManager;
    private final DeviceManager deviceManager;

    public ConfigHandler(ConfigManager configManager, DeviceManager deviceManager) {
        this.configManager = configManager;
        this.deviceManager = deviceManager;
    }

    public String handleGetConfig() {
        FilialConfig current = configManager.getConfig();
        JsonObject cfg = new JsonObject();
        cfg.put("port", current.port());
        cfg.put("httpPort", current.httpPort());
        cfg.put("adminUser", current.adminUser());
        cfg.put("adminPass", current.adminPass());
        cfg.put("deviceCount", deviceManager.count());
        return cfg.toString();
    }

    public String handlePutConfig(String body) {
        if (body == null || body.isBlank()) {
            return ApiHandler.jsonError(400, "Empty body");
        }
        try {
            FilialConfig current = configManager.getConfig();
            JsonObject obj = Json.parseObject(body);

            int port = obj.getInt("port", current.port());
            int httpPort = obj.getInt("httpPort", current.httpPort());
            String adminUser = obj.getString("adminUser", current.adminUser()).trim();
            String adminPass = obj.getString("adminPass", current.adminPass()).trim();

            if (port < 1 || port > 65535 || httpPort < 1 || httpPort > 65535) {
                return ApiHandler.jsonError(400, "Ports must be between 1 and 65535");
            }
            if (adminUser.isEmpty() || adminPass.isEmpty()) {
                return ApiHandler.jsonError(400, "Admin credentials cannot be empty");
            }
            if (!configManager.updateConfig(port, httpPort, adminUser, adminPass)) {
                return ApiHandler.jsonError(500, "Could not persist config");
            }

            FilialConfig updated = configManager.getConfig();
            JsonObject response = new JsonObject();
            response.put("port", updated.port());
            response.put("httpPort", updated.httpPort());
            response.put("adminUser", updated.adminUser());
            response.put("adminPass", updated.adminPass());
            response.put("deviceCount", deviceManager.count());
            response.put(
                "restartRequired",
                updated.port() != current.port() || updated.httpPort() != current.httpPort()
            );

            return response.toString();
        } catch (Exception e) {
            return ApiHandler.jsonError(400, "Invalid JSON");
        }
    }
}
