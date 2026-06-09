package filial;

import shared.Json;
import lib.logging.Logger;
import shared.Json.JsonArray;
import shared.Json.JsonObject;
import shared.Protocol;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
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
 *   "http_port": 8082,
 *   "admin_user": "admin",
 *   "admin_pass": "admin",
 *   "id": ["actuator_light_sala", "sensor_light_sala", ...]
 * }
 * </pre>
 */
public class ConfigManager {

    private static final Logger logger = Logger.getLogger(ConfigManager.class);

    private Path configPath;
    private FilialConfig config;

    /** Load configuration from a JSON file. Returns true on success. */
    public synchronized boolean load(String path) {
        try {
            this.configPath = Path.of(path).toAbsolutePath().normalize();
            String content = Files.readString(configPath);
            this.config = parseConfig(content);
            return true;
        } catch (IOException e) {
            logger.error("ConfigManager: IO error reading {}: {}", path, e.getMessage());
            return false;
        } catch (RuntimeException e) {
            logger.error("ConfigManager: Parse error: {}", e.getMessage());
            return false;
        }
    }

    public synchronized FilialConfig getConfig() {
        if (config == null) throw new IllegalStateException("Config not loaded");
        return config;
    }

    public synchronized boolean addDevice(String deviceId) {
        FilialConfig current = requireConfig();
        if (deviceId == null || deviceId.isBlank()) return false;
        deviceId = deviceId.trim();
        if (current.deviceIds().contains(deviceId)) return true;

        List<String> nextIds = new ArrayList<>(current.deviceIds());
        nextIds.add(deviceId);
        return saveConfig(new FilialConfig(
            current.port(),
            current.httpPort(),
            current.adminUser(),
            current.adminPass(),
            nextIds
        ));
    }

    public synchronized boolean removeDevice(String deviceId) {
        FilialConfig current = requireConfig();
        if (deviceId == null || deviceId.isBlank()) return false;
        List<String> nextIds = new ArrayList<>(current.deviceIds());
        boolean removed = nextIds.remove(deviceId.trim());
        if (!removed) return false;

        return saveConfig(new FilialConfig(
            current.port(),
            current.httpPort(),
            current.adminUser(),
            current.adminPass(),
            nextIds
        ));
    }

    public synchronized boolean renameDevice(String oldId, String newId) {
        FilialConfig current = requireConfig();
        if (oldId == null || oldId.isBlank() || newId == null || newId.isBlank()) return false;
        oldId = oldId.trim();
        newId = newId.trim();

        List<String> nextIds = new ArrayList<>(current.deviceIds());
        int index = nextIds.indexOf(oldId);
        if (index < 0 || nextIds.contains(newId)) return false;
        nextIds.set(index, newId);

        return saveConfig(new FilialConfig(
            current.port(),
            current.httpPort(),
            current.adminUser(),
            current.adminPass(),
            nextIds
        ));
    }

    public synchronized boolean updateConfig(int port, int httpPort, String adminUser, String adminPass) {
        FilialConfig current = requireConfig();
        if (!isValidPort(port) || !isValidPort(httpPort)) return false;
        return saveConfig(new FilialConfig(
            port,
            httpPort,
            adminUser.trim(),
            adminPass.trim(),
            current.deviceIds()
        ));
    }

    private FilialConfig requireConfig() {
        if (config == null) throw new IllegalStateException("Config not loaded");
        return config;
    }

    private FilialConfig parseConfig(String content) {
        JsonObject obj = Json.parseObject(content);

        int port = obj.getInt("port", Protocol.DEFAULT_PORT);
        String user = obj.getString("admin_user", Protocol.DEFAULT_USER);
        String pass = obj.getString("admin_pass", Protocol.DEFAULT_PASS);
        int httpPort = obj.getInt("http_port", Protocol.DEFAULT_HTTP_PORT);

        List<String> deviceIds = new ArrayList<>();
        if (obj.has("id")) {
            JsonArray arr = obj.getArray("id");
            for (int i = 0; i < arr.size(); i++) {
                deviceIds.add(arr.getString(i));
            }
        }

        return new FilialConfig(port, httpPort, user, pass, deviceIds);
    }

    private boolean saveConfig(FilialConfig nextConfig) {
        if (configPath == null) throw new IllegalStateException("Config path not loaded");

        Path tempFile = null;
        try {
            Path parent = configPath.toAbsolutePath().getParent();
            if (parent != null) {
                Files.createDirectories(parent);
                tempFile = Files.createTempFile(parent, "config_filial", ".tmp");
            } else {
                tempFile = Files.createTempFile("config_filial", ".tmp");
            }

            Files.writeString(tempFile, serialize(nextConfig), StandardCharsets.UTF_8);
            try {
                Files.move(tempFile, configPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tempFile, configPath, StandardCopyOption.REPLACE_EXISTING);
            }
            this.config = nextConfig;
            return true;
        } catch (IOException e) {
            logger.error("ConfigManager: IO error writing {}: {}", configPath, e.getMessage());
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                    // best-effort cleanup
                }
            }
            return false;
        }
    }

    private String serialize(FilialConfig cfg) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("\t\"port\": ").append(cfg.port()).append(",\n");
        sb.append("\t\"http_port\": ").append(cfg.httpPort()).append(",\n");
        sb.append("\t\"admin_user\": ").append(Json.escape(cfg.adminUser())).append(",\n");
        sb.append("\t\"admin_pass\": ").append(Json.escape(cfg.adminPass())).append(",\n");
        sb.append("\t\"id\": [\n");

        List<String> deviceIds = cfg.deviceIds();
        for (int i = 0; i < deviceIds.size(); i++) {
            sb.append("\t\t").append(Json.escape(deviceIds.get(i)));
            if (i < deviceIds.size() - 1) {
                sb.append(",");
            }
            sb.append("\n");
        }

        sb.append("\t]\n");
        sb.append("}\n");
        return sb.toString();
    }

    private boolean isValidPort(int port) {
        return port >= 1 && port <= 65535;
    }
}
