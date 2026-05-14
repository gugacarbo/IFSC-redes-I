package lib.logging;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class Logger {
    private static final Map<String, Logger> instances = new ConcurrentHashMap<>();
    private static volatile LogConfig config;
    private static volatile ConsoleHandler console;
    private static volatile FileHandler fileHandler;

    private final String name;

    private Logger(String name) {
        this.name = name;
    }

    public static Logger getLogger(Class<?> clazz) {
        return getLogger(clazz.getSimpleName());
    }

    public static Logger getLogger(String name) {
        return instances.computeIfAbsent(name, Logger::new);
    }

    private static void ensureInitialized() {
        if (config == null) {
            synchronized (Logger.class) {
                if (config == null) {
                    config = LogConfig.load();
                    console = new ConsoleHandler();
                    if (config.hasFile()) {
                        fileHandler = new FileHandler(
                            config.getFilePath(),
                            config.getMaxFileSize(),
                            config.getMaxBackups()
                        );
                    }
                }
            }
        }
    }

    private void log(LogLevel level, String format, Object... args) {
        ensureInitialized();
        if (!level.isEnabled(config.getLevel())) return;

        String message = args.length > 0 ? formatMessage(format, args) : format;
        console.write(level, name, message);
        if (fileHandler != null) {
            fileHandler.write(level, name, message);
        }
    }

    private String formatMessage(String template, Object... args) {
        StringBuilder sb = new StringBuilder();
        int argIdx = 0;
        int start = 0;
        while (true) {
            int brace = template.indexOf("{}", start);
            if (brace == -1) break;
            sb.append(template, start, brace);
            if (argIdx < args.length) {
                Object arg = args[argIdx++];
                sb.append(arg != null ? arg : "null");
            } else {
                sb.append("{}");
            }
            start = brace + 2;
        }
        sb.append(template.substring(start));
        return sb.toString();
    }

    public void debug(String format, Object... args) { log(LogLevel.DEBUG, format, args); }
    public void info(String format, Object... args) { log(LogLevel.INFO, format, args); }
    public void warn(String format, Object... args) { log(LogLevel.WARN, format, args); }
    public void error(String format, Object... args) { log(LogLevel.ERROR, format, args); }
}
