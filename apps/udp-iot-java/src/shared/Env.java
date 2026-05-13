package shared;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Simple .env file loader.
 *
 * <p>Reads a {@code .env} file from the working directory and makes
 * values available via typed getters. Supports:
 * <ul>
 *   <li>{@code KEY=VALUE} lines (trimmed)</li>
 *   <li>Commented lines starting with {@code #}</li>
 *   <li>Empty lines (ignored)</li>
 *   <li>Values with or without surrounding quotes</li>
 * </ul>
 *
 * <p>Usage:
 * <pre>
 *   Env.load();                    // reads .env from working dir
 *   int port = Env.getInt("MATRIZ_HTTP_PORT", 8080);
 * </pre>
 */
public final class Env {

    private static final Map<String, String> entries = new HashMap<>();
    private static boolean loaded = false;

    private Env() {}

    /** Load the {@code .env} file from the current working directory. */
    public static void load() {
        load(".env");
    }

    /** Load environment variables from a specific file path. */
    public static void load(String path) {
        try {
            var lines = Files.readAllLines(Path.of(path));
            for (String raw : lines) {
                String line = raw.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                int sep = line.indexOf('=');
                if (sep == -1) continue;

                String key = line.substring(0, sep).trim();
                String val = line.substring(sep + 1).trim();

                // Strip surrounding quotes if present
                if ((val.startsWith("\"") && val.endsWith("\""))
                        || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length() - 1);
                }

                // Also check environment variable (CLI overrides .env file)
                String envVal = System.getenv(key);
                entries.put(key, envVal != null ? envVal : val);
            }
            loaded = true;
        } catch (IOException e) {
            // .env file not found — not an error, use defaults
            loaded = true;
        }
    }

    /** Ensure .env is loaded before any access. */
    private static void ensureLoaded() {
        if (!loaded) load();
    }

    // ---- Getters ----

    /** Get a string value, or {@code defaultValue} if not found. */
    public static String get(String key, String defaultValue) {
        ensureLoaded();
        return entries.getOrDefault(key, defaultValue);
    }

    /** Get an integer value, or {@code defaultValue} if not found or invalid. */
    public static int getInt(String key, int defaultValue) {
        ensureLoaded();
        String val = entries.get(key);
        if (val == null) return defaultValue;
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /** Get a boolean value, or {@code defaultValue} if not found. */
    public static boolean getBoolean(String key, boolean defaultValue) {
        ensureLoaded();
        String val = entries.get(key);
        if (val == null) return defaultValue;
        return "true".equalsIgnoreCase(val)
            || "1".equals(val)
            || "yes".equalsIgnoreCase(val);
    }

    /** Check if a key exists in the .env file. */
    public static boolean has(String key) {
        ensureLoaded();
        return entries.containsKey(key);
    }
}
