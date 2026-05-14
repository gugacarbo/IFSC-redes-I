package lib.logging;

import java.io.PrintStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ConsoleHandler {
    private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void write(LogLevel level, String loggerName, String message) {
        PrintStream out = (level == LogLevel.ERROR) ? System.err : System.out;
        out.println(format(level, loggerName, message));
    }

    private String format(LogLevel level, String loggerName, String message) {
        return "[" + LocalDateTime.now().format(FORMATTER) + "] "
            + "[" + level.name() + "] "
            + "[" + loggerName + "] "
            + message;
    }
}
