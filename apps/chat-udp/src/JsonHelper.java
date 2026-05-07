import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility methods for JSON serialization/deserialization
 * and message formatting used by the chat application.
 */
public final class JsonHelper {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm:ss");

    private JsonHelper() { }

    /** Build a JSON message payload. */
    public static String buildMessage(String username, String message) {
        String date = LocalDate.now().format(DATE_FMT);
        String time = LocalTime.now().format(TIME_FMT);
        return String.format(
                "{\"date\":\"%s\",\"time\":\"%s\",\"username\":\"%s\",\"message\":\"%s\"}",
                escape(date), escape(time),
                escape(username), escape(message)
        );
    }

    /** Escape a string for embedding in a JSON value. */
    public static String escape(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /** Extract a single JSON string value by key (naive parser, no nesting). */
    public static String extractValue(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return "";
        start += search.length();

        StringBuilder value = new StringBuilder();
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '\\' && i + 1 < json.length()) {
                char next = json.charAt(++i);
                switch (next) {
                    case '"'  -> value.append('"');
                    case '\\' -> value.append('\\');
                    case 'n'  -> value.append('\n');
                    case 'r'  -> value.append('\r');
                    case 't'  -> value.append('\t');
                    default   -> value.append(c).append(next);
                }
            } else if (c == '"') {
                break;
            } else {
                value.append(c);
            }
        }
        return value.toString();
    }

    /** Format a chat message for display. */
    public static String formatMessage(String date, String time,
                                        String user, String msg) {
        return String.format("[%s %s] %s: %s", date, time, user, msg);
    }
}
