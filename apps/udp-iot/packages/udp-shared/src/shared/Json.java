package shared;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Zero-dependency JSON parser and builder.
 *
 * <p>Usage:
 * <pre>
 *   // Parse
 *   JsonValue val = Json.parse("{\"cmd\":\"list_resp\",\"val\":true}");
 *   JsonObject obj = val.asObject();
 *   String cmd = obj.getString("cmd");
 *   boolean v  = obj.getBoolean("val");
 *
 *   // Build
 *   String json = Json.object()
 *       .put("cmd", "list_resp")
 *       .put("id", Json.array().add("dev1").add("dev2"))
 *       .toString();
 * </pre>
 */
public final class Json {

    private Json() {}

    // ---- Parse entry point ----

    /** Parse a JSON string into a JsonValue tree. */
    public static JsonValue parse(String text) {
        return new Parser(text).parseValue();
    }

    /** Convenience: parse to JsonObject (throws if not object). */
    public static JsonObject parseObject(String text) {
        return parse(text).asObject();
    }

    /** Convenience: parse to JsonArray (throws if not array). */
    public static JsonArray parseArray(String text) {
        return parse(text).asArray();
    }

    // ---- Factory methods ----

    public static JsonObject object() { return new JsonObject(); }

    public static JsonArray  array()  { return new JsonArray(); }

    // ---- Static value creators ----

    public static JsonValue value(String s)  { return new JsonString(s); }
    public static JsonValue value(int i)     { return new JsonNumber(i); }
    public static JsonValue value(long l)    { return new JsonNumber(l); }
    public static JsonValue value(double d)  { return new JsonNumber(d); }
    public static JsonValue value(boolean b) { return b ? JsonTrue.INSTANCE : JsonFalse.INSTANCE; }
    public static JsonValue value(Object o) {
        if (o == null) return JsonNull.INSTANCE;
        if (o instanceof JsonValue v) return v;
        if (o instanceof String  s) return value(s);
        if (o instanceof Boolean b) return value(b);
        if (o instanceof Integer i) return value(i);
        if (o instanceof Long    l) return value(l);
        if (o instanceof Double  d) return value(d);
        return value(o.toString());
    }

    public static final JsonValue NULL  = JsonNull.INSTANCE;
    public static final JsonValue TRUE  = JsonTrue.INSTANCE;
    public static final JsonValue FALSE = JsonFalse.INSTANCE;

    // ================================================================
    //  JsonValue hierarchy
    // ================================================================

    public interface JsonValue {
        default JsonObject asObject()  { throw new ClassCastException("Not a JSON object: " + this); }
        default JsonArray  asArray()   { throw new ClassCastException("Not a JSON array: " + this); }
        default String     asString()  { throw new ClassCastException("Not a JSON string: " + this); }
        default int        asInt()     { throw new ClassCastException("Not a JSON number: " + this); }
        default long       asLong()    { throw new ClassCastException("Not a JSON number: " + this); }
        default double     asDouble()  { throw new ClassCastException("Not a JSON number: " + this); }
        default boolean    asBoolean() { throw new ClassCastException("Not a JSON boolean: " + this); }
        default boolean isNull()       { return false; }
        String toString();
    }

    // ---- JsonObject ----

    public static final class JsonObject implements JsonValue {
        private final LinkedHashMap<String, JsonValue> map = new LinkedHashMap<>();

        public JsonObject put(String key, JsonValue val) {
            map.put(Objects.requireNonNull(key), val == null ? JsonNull.INSTANCE : val);
            return this;
        }
        public JsonObject put(String key, String  val) { return put(key, val == null ? JsonNull.INSTANCE : value(val)); }
        public JsonObject put(String key, int      val) { return put(key, value(val)); }
        public JsonObject put(String key, long     val) { return put(key, value(val)); }
        public JsonObject put(String key, double   val) { return put(key, value(val)); }
        public JsonObject put(String key, boolean  val) { return put(key, value(val)); }
        public JsonObject put(String key, JsonObject val) { return put(key, (JsonValue) val); }
        public JsonObject put(String key, JsonArray  val) { return put(key, (JsonValue) val); }

        public boolean has(String key) { return map.containsKey(key); }

        public JsonValue get(String key) {
            JsonValue v = map.get(key);
            if (v == null) throw new IllegalArgumentException("Key not found: " + key);
            return v;
        }

        public String   getString(String key)  { return get(key).asString(); }
        public int      getInt(String key)     { return get(key).asInt(); }
        public long     getLong(String key)    { return get(key).asLong(); }
        public double   getDouble(String key)  { return get(key).asDouble(); }
        public boolean  getBoolean(String key) { return get(key).asBoolean(); }
        public JsonObject getObject(String key) { return get(key).asObject(); }
        public JsonArray  getArray(String key)  { return get(key).asArray(); }

        /** Return value or defaultValue if key not present. */
        public String getString(String key, String defaultValue) {
            JsonValue v = map.get(key);
            return v == null || v.isNull() ? defaultValue : v.asString();
        }
        public int getInt(String key, int defaultValue) {
            JsonValue v = map.get(key);
            return v == null || v.isNull() ? defaultValue : v.asInt();
        }
        public boolean getBoolean(String key, boolean defaultValue) {
            JsonValue v = map.get(key);
            return v == null || v.isNull() ? defaultValue : v.asBoolean();
        }

        public JsonValue remove(String key) { return map.remove(key); }
        public int size()  { return map.size(); }
        public boolean isEmpty() { return map.isEmpty(); }
        public Iterable<Map.Entry<String, JsonValue>> entries() { return map.entrySet(); }

        @Override
        public JsonObject asObject() { return this; }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String, JsonValue> e : map.entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append(escape(e.getKey())).append(":").append(e.getValue().toString());
            }
            return sb.append("}").toString();
        }
    }

    // ---- JsonArray ----

    public static final class JsonArray implements JsonValue {
        private final ArrayList<JsonValue> list = new ArrayList<>();

        public JsonArray add(JsonValue val) {
            list.add(val == null ? JsonNull.INSTANCE : val);
            return this;
        }
        public JsonArray add(String  val) { return add(val == null ? JsonNull.INSTANCE : value(val)); }
        public JsonArray add(int     val) { return add(value(val)); }
        public JsonArray add(long    val) { return add(value(val)); }
        public JsonArray add(double  val) { return add(value(val)); }
        public JsonArray add(boolean val) { return add(value(val)); }

        public JsonValue get(int index) { return list.get(index); }
        public String    getString(int index) { return get(index).asString(); }
        public int       getInt(int index)    { return get(index).asInt(); }
        public boolean   getBoolean(int index) { return get(index).asBoolean(); }
        public JsonObject getObject(int index) { return get(index).asObject(); }

        public int    size()  { return list.size(); }
        public boolean isEmpty() { return list.isEmpty(); }

        @Override
        public JsonArray asArray() { return this; }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (JsonValue v : list) {
                if (!first) sb.append(",");
                first = false;
                sb.append(v.toString());
            }
            return sb.append("]").toString();
        }
    }

    // ---- Leaf types ----

    private static final class JsonString implements JsonValue {
        final String value;
        JsonString(String value) { this.value = Objects.requireNonNull(value); }
        @Override public String asString() { return value; }
        @Override public String toString() { return escape(value); }
    }

    private static final class JsonNumber implements JsonValue {
        final Number value;
        JsonNumber(int     v) { this.value = v; }
        JsonNumber(long    v) { this.value = v; }
        JsonNumber(double  v) { this.value = v; }

        private Number resolve() {
            if (value instanceof Double d) {
                if (d == Math.floor(d) && !Double.isInfinite(d)) return d.longValue();
                return d;
            }
            if (value instanceof Float f) {
                if (f == Math.floor(f) && !Float.isInfinite(f)) return f.longValue();
                return f.doubleValue();
            }
            return value;
        }

        @Override public int    asInt()    { return resolve().intValue(); }
        @Override public long   asLong()   { return resolve().longValue(); }
        @Override public double asDouble() { return value.doubleValue(); }

        @Override
        public String toString() {
            Number n = resolve();
            if (n instanceof Long l) return l.toString();
            if (n instanceof Double d) {
                if (d == Math.floor(d) && !Double.isInfinite(d))
                    return String.valueOf(d.longValue());
                return d.toString();
            }
            return n.toString();
        }
    }

    private static class JsonBoolean implements JsonValue {
        final boolean value;
        JsonBoolean(boolean v) { this.value = v; }
        @Override public boolean asBoolean() { return value; }
        @Override public String toString() { return Boolean.toString(value); }
    }

    private static final class JsonTrue extends JsonBoolean {
        static final JsonTrue INSTANCE = new JsonTrue();
        private JsonTrue() { super(true); }
    }

    private static final class JsonFalse extends JsonBoolean {
        static final JsonFalse INSTANCE = new JsonFalse();
        private JsonFalse() { super(false); }
    }

    private static final class JsonNull implements JsonValue {
        static final JsonNull INSTANCE = new JsonNull();
        @Override public boolean isNull() { return true; }
        @Override public String toString() { return "null"; }
    }

    // ================================================================
    //  Parser (recursive descent)
    // ================================================================

    private static final class Parser {
        private final String src;
        private int pos;

        Parser(String src) {
            this.src = src;
            this.pos = 0;
        }

        JsonValue parseValue() {
            skipWhitespace();
            if (pos >= src.length()) throw err("Unexpected end of JSON");
            char c = src.charAt(pos);
            return switch (c) {
                case '{' -> parseObject();
                case '[' -> parseArray();
                case '"' -> new JsonString(parseString());
                case 't', 'f' -> parseBoolean();
                case 'n' -> parseNull();
                default -> parseNumber();
            };
        }

        JsonObject parseObject() {
            expect('{');
            JsonObject obj = new JsonObject();
            skipWhitespace();
            if (maybe('}')) return obj;
    while (true) {
        skipWhitespace();
        // parseString() already handles the opening quote
        String key = parseString();
                skipWhitespace();
                expect(':');
                JsonValue val = parseValue();
                obj.put(key, val);
                skipWhitespace();
                if (maybe(',')) continue;
                if (maybe('}')) return obj;
                throw err("Expected ',' or '}' in object");
            }
        }

        JsonArray parseArray() {
            expect('[');
            JsonArray arr = new JsonArray();
            skipWhitespace();
            if (maybe(']')) return arr;
            while (true) {
                arr.add(parseValue());
                skipWhitespace();
                if (maybe(',')) continue;
                if (maybe(']')) return arr;
                throw err("Expected ',' or ']' in array");
            }
        }

        String parseString() {
            expect('"');
            StringBuilder sb = new StringBuilder();
            while (pos < src.length()) {
                char c = src.charAt(pos++);
                if (c == '"') return sb.toString();
                if (c == '\\') {
                    if (pos >= src.length()) throw err("Unexpected end in string escape");
                    char e = src.charAt(pos++);
                    switch (e) {
                        case '"'  -> sb.append('"');
                        case '\\' -> sb.append('\\');
                        case '/'  -> sb.append('/');
                        case 'b'  -> sb.append('\b');
                        case 'f'  -> sb.append('\f');
                        case 'n'  -> sb.append('\n');
                        case 'r'  -> sb.append('\r');
                        case 't'  -> sb.append('\t');
                        case 'u'  -> {
                            if (pos + 4 > src.length()) throw err("Invalid unicode escape");
                            String hex = src.substring(pos, pos + 4);
                            sb.append((char) Integer.parseInt(hex, 16));
                            pos += 4;
                        }
                        default -> throw err("Invalid escape: \\" + e);
                    }
                } else {
                    sb.append(c);
                }
            }
            throw err("Unterminated string");
        }

        JsonValue parseNumber() {
            int start = pos;
            if (pos < src.length() && src.charAt(pos) == '-') pos++;
            while (pos < src.length() && Character.isDigit(src.charAt(pos))) pos++;
            boolean isDouble = false;
            if (pos < src.length() && src.charAt(pos) == '.') {
                isDouble = true;
                pos++;
                while (pos < src.length() && Character.isDigit(src.charAt(pos))) pos++;
            }
            if (pos < src.length() && (src.charAt(pos) == 'e' || src.charAt(pos) == 'E')) {
                isDouble = true;
                pos++;
                if (pos < src.length() && (src.charAt(pos) == '+' || src.charAt(pos) == '-')) pos++;
                while (pos < src.length() && Character.isDigit(src.charAt(pos))) pos++;
            }
            if (pos == start || (pos == start + 1 && src.charAt(start) == '-'))
                throw err("Invalid number");
            String num = src.substring(start, pos);
            try {
                if (isDouble) return new JsonNumber(Double.parseDouble(num));
                long n = Long.parseLong(num);
                if (n >= Integer.MIN_VALUE && n <= Integer.MAX_VALUE)
                    return new JsonNumber((int) n);
                return new JsonNumber(n);
            } catch (NumberFormatException e) {
                throw err("Invalid number: " + num);
            }
        }

        JsonValue parseBoolean() {
            if (src.startsWith("true", pos))  { pos += 4; return JsonTrue.INSTANCE; }
            if (src.startsWith("false", pos)) { pos += 5; return JsonFalse.INSTANCE; }
            throw err("Expected boolean");
        }

        JsonValue parseNull() {
            if (src.startsWith("null", pos)) { pos += 4; return JsonNull.INSTANCE; }
            throw err("Expected null");
        }

        // ---- Helpers ----

        void skipWhitespace() {
            while (pos < src.length()) {
                char c = src.charAt(pos);
                if (c == ' ' || c == '\t' || c == '\n' || c == '\r') pos++;
                else break;
            }
        }

        void expect(char c) {
            skipWhitespace();
            if (pos >= src.length() || src.charAt(pos) != c)
                throw err("Expected '" + c + "' at position " + pos);
            pos++;
        }

        boolean maybe(char c) {
            skipWhitespace();
            if (pos < src.length() && src.charAt(pos) == c) {
                pos++;
                return true;
            }
            return false;
        }

        RuntimeException err(String msg) {
            int start = Math.max(0, pos - 20);
            int end   = Math.min(src.length(), pos + 20);
            String ctx = src.substring(start, end).replace("\n", "\\n");
            return new RuntimeException(msg + " near ..." + ctx + "...");
        }
    }

    // ================================================================
    //  String escaping
    // ================================================================

    static String escape(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 2);
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"'  -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.append('"').toString();
    }
}
