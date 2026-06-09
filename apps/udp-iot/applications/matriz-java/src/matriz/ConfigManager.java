package matriz;
import lib.logging.Logger;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages the Matriz configuration.
 *
 * <p>Replaces {@code matriz-esp32/ConfigManager.cpp}.
 * Loads from and saves to a JSON config file.
 * Thread-safe: reads/writes are synchronised on the config object.
 */
public class ConfigManager {

    private static final Logger logger = Logger.getLogger(ConfigManager.class);

    private volatile MatrizConfig config;
    private String configPath;

    /**
     * Load configuration from a JSON file.
     * @param path filesystem path to config_matriz.json
     * @return true if loaded successfully
     */
    public synchronized boolean load(String path) {
        this.configPath = path;
        try {
            this.config = readConfigFromDisk();
            return true;
        } catch (IOException e) {
            logger.error("ConfigManager: IO error: {}", e.getMessage());
            return false;
        } catch (RuntimeException e) {
            logger.error("ConfigManager: Parse error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Save current configuration to the JSON file.
     * @param jsonContent the full JSON string to write
     * @return true if saved successfully
     */
    public synchronized boolean save(String jsonContent) {
        try {
            // Validate that it parses and has required fields
            JsonObject obj = Json.parseObject(jsonContent);
            if (!obj.has("user") || !obj.has("pass")) {
                logger.warn("ConfigManager: Refusing to save — missing user/pass");
                return false;
            }

            MatrizConfig parsed = parseConfig(obj);
            writeConfigToDisk(jsonContent);
            this.config = readConfigFromDisk();
            logger.info("ConfigManager: Configuration saved ({} filiais)", parsed.filiais().size());
            return true;
        } catch (IOException e) {
            logger.error("ConfigManager: IO error on save: {}", e.getMessage());
            return false;
        } catch (RuntimeException e) {
            logger.error("ConfigManager: Invalid JSON on save: {}", e.getMessage());
            return false;
        }
    }

    /** Return the current config as a JSON string (for REST API). */
    public synchronized String getConfigJson() {
        try {
            return Files.readString(Path.of(configPath));
        } catch (IOException e) {
            throw new RuntimeException("ConfigManager: Could not read config JSON", e);
        }
    }

    /** Return the current parsed config object. */
    public synchronized MatrizConfig getConfig() {
        try {
            this.config = readConfigFromDisk();
            return config;
        } catch (IOException e) {
            throw new RuntimeException("ConfigManager: Could not refresh config from disk", e);
        }
    }

    /**
     * Find a filial's port by IP address.
     * @return port number, or 51000 if not found
     */
    public synchronized int findPortByIp(String ip) {
        for (FilialInfo f : getConfig().filiais()) {
            if (f.ip().equals(ip)) return f.port();
        }
        return 51000;
    }

    private MatrizConfig readConfigFromDisk() throws IOException {
        String content = Files.readString(Path.of(configPath));
        JsonObject obj = Json.parseObject(content);
        return parseConfig(obj);
    }

    private MatrizConfig parseConfig(JsonObject obj) {
        String user = obj.getString("user", "admin");
        String pass = obj.getString("pass", "admin");
        int pollingMs = resolvePollingMs(obj);

        List<FilialInfo> filiais = new ArrayList<>();
        if (obj.has("filiais")) {
            JsonArray arr = obj.getArray("filiais");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject f = arr.getObject(i);
                String name = f.getString("name", "Filial " + (i + 1));
                String ip   = f.getString("ip", "127.0.0.1");
                int port    = f.getInt("port", 51000);
                filiais.add(new FilialInfo(name, ip, port));
            }
        }

        return new MatrizConfig(user, pass, pollingMs, filiais);
    }

    private int resolvePollingMs(JsonObject obj) {
        if (obj.has("pollingMs")) {
            return obj.getInt("pollingMs", 0);
        }
        return obj.getInt("polling_ms", 0);
    }

    private void writeConfigToDisk(String jsonContent) throws IOException {
        Path target = Path.of(configPath);
        Path parent = target.toAbsolutePath().getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }

        Path tempFile = Files.createTempFile(parent, target.getFileName().toString(), ".tmp");
        try {
            Files.writeString(tempFile, jsonContent);
            try {
                Files.move(
                    tempFile,
                    target,
                    StandardCopyOption.REPLACE_EXISTING,
                    StandardCopyOption.ATOMIC_MOVE
                );
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tempFile, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    /** Configuration data record. */
    public record MatrizConfig(
        String user,
        String pass,
        int pollingMs,
        List<FilialInfo> filiais
    ) {}
}
