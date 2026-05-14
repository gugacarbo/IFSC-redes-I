package lib.logging;

import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class FileHandler {
    private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final String basePath;
    private final long maxSize;
    private final int maxBackups;
    private PrintWriter writer;
    private long writtenBytes;

    public FileHandler(String basePath, long maxSize, int maxBackups) {
        this.basePath = basePath;
        this.maxSize = maxSize;
        this.maxBackups = maxBackups;
        openFile();
    }

    private void openFile() {
        try {
            File file = new File(basePath);
            File parent = file.getParentFile();
            if (parent != null) parent.mkdirs();
            writtenBytes = file.length();
            writer = new PrintWriter(new FileWriter(file, true), true);
        } catch (IOException e) {
            System.err.println("Failed to open log file " + basePath + ": " + e.getMessage());
        }
    }

    public void write(LogLevel level, String loggerName, String message) {
        if (writer == null) return;

        String line = "[" + LocalDateTime.now().format(FORMATTER) + "] "
            + "[" + level.name() + "] "
            + "[" + loggerName + "] "
            + message;

        writer.println(line);
        writtenBytes += line.length() + 1;

        if (writtenBytes >= maxSize) {
            rotate();
        }
    }

    private void rotate() {
        writer.close();
        writer = null;

        // Delete the oldest backup
        File oldest = new File(basePath + "." + maxBackups);
        if (oldest.exists()) oldest.delete();

        // Shift all backups up by one
        for (int i = maxBackups - 1; i >= 1; i--) {
            File f = new File(basePath + "." + i);
            if (f.exists()) f.renameTo(new File(basePath + "." + (i + 1)));
        }

        // Rename current log
        File current = new File(basePath);
        if (current.exists()) current.renameTo(new File(basePath + ".1"));

        openFile();
    }
}
