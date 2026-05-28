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
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /** Extract a single JSON string value by key from a JSON object. */
    public static String extractValue(String json, String key) {
        if (json == null || key == null || key.isEmpty()) return "";

        for (int i = 0; i < json.length(); i++) {
            if (json.charAt(i) != '"') continue;

            ParsedString parsedKey = readString(json, i);
            if (parsedKey == null) return "";

            int cursor = skipWhitespace(json, parsedKey.nextIndex);
            if (cursor >= json.length() || json.charAt(cursor) != ':') {
                i = parsedKey.nextIndex - 1;
                continue;
            }

            cursor = skipWhitespace(json, cursor + 1);
            if (key.equals(parsedKey.value)) {
                if (cursor >= json.length() || json.charAt(cursor) != '"') return "";
                ParsedString parsedValue = readString(json, cursor);
                return parsedValue == null ? "" : parsedValue.value;
            }

            i = parsedKey.nextIndex - 1;
        }

        return "";
    }

    private static int skipWhitespace(String text, int index) {
        while (index < text.length() && Character.isWhitespace(text.charAt(index))) {
            index++;
        }
        return index;
    }

    private static ParsedString readString(String json, int quoteIndex) {
        if (quoteIndex >= json.length() || json.charAt(quoteIndex) != '"') {
            return null;
        }

        StringBuilder value = new StringBuilder();
        for (int i = quoteIndex + 1; i < json.length(); i++) {
            char current = json.charAt(i);

            if (current == '"') {
                return new ParsedString(value.toString(), i + 1);
            }

            if (current != '\\') {
                value.append(current);
                continue;
            }

            if (i + 1 >= json.length()) return null;

            char escaped = json.charAt(++i);
            switch (escaped) {
                case '"'  -> value.append('"');
                case '\\' -> value.append('\\');
                case '/'  -> value.append('/');
                case 'b'  -> value.append('\b');
                case 'f'  -> value.append('\f');
                case 'n'  -> value.append('\n');
                case 'r'  -> value.append('\r');
                case 't'  -> value.append('\t');
                case 'u'  -> {
                    if (i + 4 >= json.length()) return null;
                    String hex = json.substring(i + 1, i + 5);
                    try {
                        value.append((char) Integer.parseInt(hex, 16));
                        i += 4;
                    } catch (NumberFormatException e) {
                        return null;
                    }
                }
                default -> {
                    return null;
                }
            }
        }

        return null;
    }

    private record ParsedString(String value, int nextIndex) {
    }

    /** Format a chat message for display. */
    public static String formatMessage(String date, String time,
                                        String user, String msg) {
        return String.format("[%s %s] %s: %s", date, time, user, msg);
    }
}
