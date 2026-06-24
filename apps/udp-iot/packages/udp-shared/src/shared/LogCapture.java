package shared;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

public class LogCapture {

    private final ConcurrentLinkedDeque<LogEntry> entries;
    private final int maxEntries;
    private Consumer<String> broadcastListener;
    private final AtomicBoolean inCapture = new AtomicBoolean(false);
    private PrintStream originalOut;
    private PrintStream originalErr;

    public static class LogEntry {
        public final String level;
        public final String message;
        public final long ts;
        public LogEntry(String level, String message) {
            this.level = level;
            this.message = message;
            this.ts = System.currentTimeMillis();
        }
    }

    public LogCapture(int maxEntries) {
        this.maxEntries = maxEntries;
        this.entries = new ConcurrentLinkedDeque<>();
    }

    public void install() {
        originalOut = System.out;
        originalErr = System.err;
        System.setOut(new LogPrintStream(originalOut, "info"));
        System.setErr(new LogPrintStream(originalErr, "error"));
    }

    public void uninstall() {
        if (originalOut != null) System.setOut(originalOut);
        if (originalErr != null) System.setErr(originalErr);
    }

    public void setBroadcastListener(Consumer<String> listener) {
        this.broadcastListener = listener;
    }

    /** Return most recent entries, newest first, up to limit. */
    public List<LogEntry> getEntries(int limit) {
        List<LogEntry> result = new ArrayList<>();
        java.util.Iterator<LogEntry> it = entries.descendingIterator();
        while (it.hasNext() && result.size() < limit) {
            result.add(it.next());
        }
        return result;
    }

    public void clear() {
        entries.clear();
    }

    private void addEntry(String level, String message) {
        if (inCapture.get()) return;
        inCapture.set(true);
        try {
            LogEntry entry = new LogEntry(level, message);
            entries.addLast(entry);
            while (entries.size() > maxEntries) entries.pollFirst();
            if (broadcastListener != null) {
                broadcastListener.accept(
                    "{\"type\":\"log\",\"level\":\"" + level
                        + "\",\"message\":" + Json.escape(message)
                        + ",\"ts\":" + entry.ts + "}"
                );
            }
        } finally {
            inCapture.set(false);
        }
    }

    private class LogPrintStream extends PrintStream {
        private final String level;
        LogPrintStream(PrintStream original, String level) {
            super(original);
            this.level = level;
        }
        @Override public void println(String x) { super.println(x); addEntry(level, x); }
        @Override public void println(Object x) { super.println(x); addEntry(level, String.valueOf(x)); }
        @Override public void println() { super.println(); addEntry(level, ""); }
    }
}
