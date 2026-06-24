package filial.config;

import filial.model.FilialConfig;
import lib.logging.Logger;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class ConfigManager {

    private static final Logger logger = Logger.getLogger(ConfigManager.class);

    private Path configPath;
    private FilialConfig config;

    public synchronized boolean load(String path) {
        try {
            this.configPath = Path.of(path).toAbsolutePath().normalize();
            String content = Files.readString(configPath);
            this.config = ConfigSerializer.parseConfig(content);
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
            current.port(), current.httpPort(), current.adminUser(), current.adminPass(), nextIds
        ));
    }

    public synchronized boolean removeDevice(String deviceId) {
        FilialConfig current = requireConfig();
        if (deviceId == null || deviceId.isBlank()) return false;
        List<String> nextIds = new ArrayList<>(current.deviceIds());
        boolean removed = nextIds.remove(deviceId.trim());
        if (!removed) return false;

        return saveConfig(new FilialConfig(
            current.port(), current.httpPort(), current.adminUser(), current.adminPass(), nextIds
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
            current.port(), current.httpPort(), current.adminUser(), current.adminPass(), nextIds
        ));
    }

    public synchronized boolean updateConfig(int port, int httpPort, String adminUser, String adminPass) {
        FilialConfig current = requireConfig();
        if (!ConfigSerializer.isValidPort(port) || !ConfigSerializer.isValidPort(httpPort)) return false;
        return saveConfig(new FilialConfig(
            port, httpPort, adminUser.trim(), adminPass.trim(), current.deviceIds()
        ));
    }

    private FilialConfig requireConfig() {
        if (config == null) throw new IllegalStateException("Config not loaded");
        return config;
    }

    private boolean saveConfig(FilialConfig nextConfig) {
        boolean success = ConfigPersistence.save(configPath, nextConfig);
        if (success) {
            this.config = nextConfig;
        }
        return success;
    }
}
