package matriz;
import lib.logging.Logger;

import shared.Json;
import shared.Json.JsonArray;
import shared.Json.JsonObject;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
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
            String content = Files.readString(Path.of(path));
            JsonObject obj = Json.parseObject(content);

            String user = obj.getString("user", "admin");
            String pass = obj.getString("pass", "admin");
            int pollingMs = obj.getInt("polling_ms", 0);

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

            this.config = new MatrizConfig(user, pass, pollingMs, filiais);
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

            // Re-parse to update in-memory config
            // (We could re-call load, but this avoids re-reading the file)
            String user = obj.getString("user");
            String pass = obj.getString("pass");
            int pollingMs = obj.getInt("polling_ms", 0);

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

            this.config = new MatrizConfig(user, pass, pollingMs, filiais);

            // Write to file
            Files.writeString(Path.of(configPath), jsonContent);
            logger.info("ConfigManager: Configuration saved ({} filiais)", filiais.size());
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
        JsonObject obj = new JsonObject();
        obj.put("user", config.user());
        obj.put("pass", config.pass());
        obj.put("polling_ms", config.pollingMs());

        JsonArray arr = new JsonArray();
        for (FilialInfo f : config.filiais()) {
            arr.add(Json.object()
                .put("name", f.name())
                .put("ip", f.ip())
                .put("port", f.port()));
        }
        obj.put("filiais", arr);
        return obj.toString();
    }

    /** Return the current parsed config object. */
    public MatrizConfig getConfig() {
        return config;
    }

    /**
     * Find a filial's port by IP address.
     * @return port number, or 51000 if not found
     */
    public int findPortByIp(String ip) {
        for (FilialInfo f : config.filiais()) {
            if (f.ip().equals(ip)) return f.port();
        }
        return 51000;
    }

    /** Configuration data record. */
    public record MatrizConfig(
        String user,
        String pass,
        int pollingMs,
        List<FilialInfo> filiais
    ) {}
}
