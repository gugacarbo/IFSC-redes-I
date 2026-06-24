package filial.config;

import filial.model.FilialConfig;
import lib.logging.Logger;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class ConfigPersistence {

    private static final Logger logger = Logger.getLogger(ConfigPersistence.class);

    public static boolean save(Path configPath, FilialConfig config) {
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

            Files.writeString(tempFile, ConfigSerializer.serialize(config), StandardCharsets.UTF_8);
            try {
                Files.move(tempFile, configPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tempFile, configPath, StandardCopyOption.REPLACE_EXISTING);
            }
            return true;
        } catch (IOException e) {
            logger.error("ConfigPersistence: IO error writing {}: {}", configPath, e.getMessage());
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                }
            }
            return false;
        }
    }
}
