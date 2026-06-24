package lib.logging;

public class LogConfig {
    private static final long DEFAULT_MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB
    private static final int DEFAULT_MAX_BACKUPS = 5;

    private final LogLevel level;
    private final String filePath;
    private final long maxFileSize;
    private final int maxBackups;

    public LogConfig(LogLevel level, String filePath, long maxFileSize, int maxBackups) {
        this.level = level;
        this.filePath = filePath;
        this.maxFileSize = maxFileSize;
        this.maxBackups = maxBackups;
    }

    public LogLevel getLevel() { return level; }
    public String getFilePath() { return filePath; }
    public long getMaxFileSize() { return maxFileSize; }
    public int getMaxBackups() { return maxBackups; }
    public boolean hasFile() { return filePath != null && !filePath.isEmpty(); }

    public static LogConfig load() {
        LogLevel level = LogLevel.fromString(System.getenv("LOG_LEVEL"));
        String filePath = System.getenv("LOG_FILE");
        long maxFileSize = parseSize(System.getenv("LOG_FILE_MAX_SIZE"), DEFAULT_MAX_FILE_SIZE);
        int maxBackups = parseInt(System.getenv("LOG_FILE_MAX_BACKUPS"), DEFAULT_MAX_BACKUPS);
        return new LogConfig(level, filePath, maxFileSize, maxBackups);
    }

    private static long parseSize(String s, long defaultVal) {
        if (s == null || s.isEmpty()) return defaultVal;
        s = s.trim().toUpperCase();
        try {
            if (s.endsWith("KB")) return Long.parseLong(s.substring(0, s.length() - 2)) * 1024;
            if (s.endsWith("MB")) return Long.parseLong(s.substring(0, s.length() - 2)) * 1024 * 1024;
            if (s.endsWith("GB")) return Long.parseLong(s.substring(0, s.length() - 2)) * 1024 * 1024 * 1024;
            return Long.parseLong(s);
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private static int parseInt(String s, int defaultVal) {
        if (s == null || s.isEmpty()) return defaultVal;
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }
}
