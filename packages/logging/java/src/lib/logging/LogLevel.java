package lib.logging;

public enum LogLevel {
    DEBUG(0),
    INFO(1),
    WARN(2),
    ERROR(3);

    private final int level;

    LogLevel(int level) {
        this.level = level;
    }

    public boolean isEnabled(LogLevel minimum) {
        return this.level >= minimum.level;
    }

    public static LogLevel fromString(String s) {
        if (s == null) return INFO;
        try {
            return valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return INFO;
        }
    }
}
