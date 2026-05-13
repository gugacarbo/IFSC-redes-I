package filial;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import shared.Protocol;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Configuration holder for a Filial instance.
 *
 * <p>Reads the JSON config file and populates a {@link FilialConfig} record.
 *
 * <p>Expected JSON format:
 * <pre>
 * {
 *   "port": 51000,
 *   "admin_user": "admin",
 *   "admin_pass": "admin",
 *   "id": ["actuator_light_sala", "sensor_light_sala", ...]
 * }
 * </pre>
 */
public class ConfigManager {

    private FilialConfig config;

    /** Load configuration from a JSON file. Returns true on success. */
    public boolean load(String path) {
        try {
            String content = Files.readString(Path.of(path));
            JsonObject obj = Json.parseObject(content);

            int port = obj.getInt("port", Protocol.DEFAULT_PORT);
            String user = obj.getString("admin_user", Protocol.DEFAULT_USER);
            String pass = obj.getString("admin_pass", Protocol.DEFAULT_PASS);

            List<String> deviceIds = new ArrayList<>();
            if (obj.has("id")) {
                JsonArray arr = obj.getArray("id");
                for (int i = 0; i < arr.size(); i++) {
                    deviceIds.add(arr.getString(i));
                }
            }

            this.config = new FilialConfig(port, user, pass, deviceIds);
            return true;
        } catch (IOException e) {
            System.err.println("ConfigManager: IO error reading " + path + ": " + e.getMessage());
            return false;
        } catch (RuntimeException e) {
            System.err.println("ConfigManager: Parse error: " + e.getMessage());
            return false;
        }
    }

    public FilialConfig getConfig() {
        if (config == null) throw new IllegalStateException("Config not loaded");
        return config;
    }
}
