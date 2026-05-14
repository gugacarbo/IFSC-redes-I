# Logging Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a shared `packages/logging/` directory with structured loggers for Java and TypeScript

**Architecture:** Two sub-packages under `packages/logging/`: `java/` (plain Java, no build tools) and `ts/` (TypeScript npm workspace package `@lib/logging`). Java uses package `lib.logging`, TypeScript uses `@lib/logging`. Both implement named loggers (via `Logger.getLogger(name)`) with levels DEBUG/INFO/WARN/ERROR, console output, optional file output with rotation.

**Tech Stack:** Java (javac-only), TypeScript, npm workspaces

---

### File Inventory

**Create:**
- `packages/logging/java/src/lib/logging/LogLevel.java`
- `packages/logging/java/src/lib/logging/LogConfig.java`
- `packages/logging/java/src/lib/logging/ConsoleHandler.java`
- `packages/logging/java/src/lib/logging/FileHandler.java`
- `packages/logging/java/src/lib/logging/Logger.java`
- `packages/logging/ts/package.json`
- `packages/logging/ts/tsconfig.json`
- `packages/logging/ts/src/logger.ts`

**Modify:**
- `applications/filial-java/scripts/run-java.cjs` — add logging classpath
- `applications/matriz-java/scripts/run-java.cjs` — add logging classpath

---

### Task 1: Create LogLevel enum (Java)

**Files:**
- Create: `packages/logging/java/src/lib/logging/LogLevel.java`

- [ ] **Step 1: Create LogLevel.java**

```java
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
```

- [ ] **Step 2: Create parent directories**

```bash
mkdir -p /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot/packages/logging/java/src/lib/logging
```

- [ ] **Step 3: Compile-check**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
javac packages/logging/java/src/lib/logging/LogLevel.java -d /tmp/logging-check
echo "Compiled OK"
```

- [ ] **Step 4: Commit**

```bash
git add packages/logging/java/src/lib/logging/LogLevel.java
git commit -m "feat(logging): add LogLevel enum with DEBUG/INFO/WARN/ERROR"
```

---

### Task 2: Create LogConfig (Java)

**Files:**
- Create: `packages/logging/java/src/lib/logging/LogConfig.java`

- [ ] **Step 1: Create LogConfig.java**

```java
package lib.logging;

import java.io.File;

public class LogConfig {
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
        long maxFileSize = parseSize(System.getenv("LOG_FILE_MAX_SIZE"), 10 * 1024 * 1024);
        int maxBackups = parseInt(System.getenv("LOG_FILE_MAX_BACKUPS"), 5);
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
```

- [ ] **Step 2: Compile-check**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
javac packages/logging/java/src/lib/logging/LogConfig.java \
  packages/logging/java/src/lib/logging/LogLevel.java \
  -d /tmp/logging-check
echo "Compiled OK"
```

- [ ] **Step 3: Commit**

```bash
git add packages/logging/java/src/lib/logging/LogConfig.java
git commit -m "feat(logging): add LogConfig with env var loading"
```

---

### Task 3: Create ConsoleHandler (Java)

**Files:**
- Create: `packages/logging/java/src/lib/logging/ConsoleHandler.java`

- [ ] **Step 1: Create ConsoleHandler.java**

```java
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
```

- [ ] **Step 2: Compile-check**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
javac packages/logging/java/src/lib/logging/ConsoleHandler.java \
  packages/logging/java/src/lib/logging/LogLevel.java \
  -d /tmp/logging-check
echo "Compiled OK"
```

- [ ] **Step 3: Commit**

```bash
git add packages/logging/java/src/lib/logging/ConsoleHandler.java
git commit -m "feat(logging): add ConsoleHandler for stdout/stderr output"
```

---

### Task 4: Create FileHandler (Java)

**Files:**
- Create: `packages/logging/java/src/lib/logging/FileHandler.java`

- [ ] **Step 1: Create FileHandler.java**

```java
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
```

- [ ] **Step 2: Compile-check**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
javac packages/logging/java/src/lib/logging/FileHandler.java \
  packages/logging/java/src/lib/logging/LogLevel.java \
  -d /tmp/logging-check
echo "Compiled OK"
```

- [ ] **Step 3: Commit**

```bash
git add packages/logging/java/src/lib/logging/FileHandler.java
git commit -m "feat(logging): add FileHandler with size-based rotation"
```

---

### Task 5: Create Logger (Java)

**Files:**
- Create: `packages/logging/java/src/lib/logging/Logger.java`

- [ ] **Step 1: Create Logger.java**

```java
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
```

- [ ] **Step 2: Compile-check**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
javac packages/logging/java/src/lib/logging/Logger.java \
  packages/logging/java/src/lib/logging/LogLevel.java \
  packages/logging/java/src/lib/logging/LogConfig.java \
  packages/logging/java/src/lib/logging/ConsoleHandler.java \
  packages/logging/java/src/lib/logging/FileHandler.java \
  -d /tmp/logging-check
echo "Compiled OK"
```

- [ ] **Step 3: Commit**

```bash
git add packages/logging/java/src/lib/logging/Logger.java
git commit -m "feat(logging): add Logger with named instances and {} formatting"
```

---

### Task 6: Create TypeScript logger package

**Files:**
- Create: `packages/logging/ts/package.json`
- Create: `packages/logging/ts/tsconfig.json`
- Create: `packages/logging/ts/src/logger.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@lib/logging",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/logger.ts",
  "types": "./src/logger.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["."],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create src/logger.ts**

```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogConfig {
  level: LogLevel;
}

export class Logger {
  private static instances = new Map<string, Logger>();
  private static level = LogLevel.INFO;

  static configure(config: LogConfig): void {
    Logger.level = config.level;
  }

  static getLogger(name: string): Logger {
    let instance = Logger.instances.get(name);
    if (!instance) {
      instance = new Logger(name);
      Logger.instances.set(name, instance);
    }
    return instance;
  }

  private constructor(private readonly name: string) {}

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (level < Logger.level) return;

    const formatted = args.length > 0 ? this.format(message, args) : message;
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const line = `[${timestamp}] [${LogLevel[level]}] [${this.name}] ${formatted}`;

    if (level === LogLevel.ERROR) {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  private format(template: string, args: unknown[]): string {
    let i = 0;
    return template.replace(/%[sdfoO]/g, () => {
      const val = i < args.length ? args[i++] : "%";
      return String(val ?? "");
    });
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}
```

- [ ] **Step 4: Create parent directories**

```bash
mkdir -p /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot/packages/logging/ts/src
```

- [ ] **Step 5: Install dependencies and typecheck**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
npm install
npx tsc --noEmit -p packages/logging/ts
echo "Typecheck OK"
```

- [ ] **Step 6: Commit**

```bash
git add packages/logging/ts/
git commit -m "feat(logging): add TypeScript logger package @lib/logging"
```

---

### Task 7: Update run-java.cjs in both apps

**Files:**
- Modify: `applications/filial-java/scripts/run-java.cjs`
- Modify: `applications/matriz-java/scripts/run-java.cjs`

- [ ] **Step 1: Update filial-java/scripts/run-java.cjs**

Add `loggingSrcDir` and include it in both classpaths:

```javascript
const sharedSrcDir = path.join("..", "..", "packages", "udp-shared", "src");
const loggingSrcDir = path.join("..", "..", "packages", "logging", "java", "src");
const sourceClasspath = ["src", sharedSrcDir, loggingSrcDir].join(
    path.delimiter,
);
const runtimeClasspath = ["dist", sharedSrcDir, loggingSrcDir].join(
    path.delimiter,
);
```

- [ ] **Step 2: Update matriz-java/scripts/run-java.cjs**

Same change:

```javascript
const sharedSrcDir = path.join("..", "..", "packages", "udp-shared", "src");
const loggingSrcDir = path.join("..", "..", "packages", "logging", "java", "src");
const sourceClasspath = ["src", sharedSrcDir, loggingSrcDir].join(path.delimiter);
const runtimeClasspath = ["dist", sharedSrcDir, loggingSrcDir].join(path.delimiter);
```

- [ ] **Step 3: Verify compilation still works**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
npx turbo run build --filter=@udp-iot/filial-java
npx turbo run build --filter=@udp-iot/matriz-java
echo "Both apps compile OK"
```

- [ ] **Step 4: Commit**

```bash
git add applications/filial-java/scripts/run-java.cjs
git add applications/matriz-java/scripts/run-java.cjs
git commit -m "feat(logging): add logging package to Java app classpaths"
```

---

### Task 8: Verify end-to-end

- [ ] **Step 1: Quick smoke test — compile logging package + both apps**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
npx turbo run build --filter=@udp-iot/filial-java --filter=@udp-iot/matriz-java
echo "All builds pass"
```

- [ ] **Step 2: Full workspace build**

```bash
cd /home/gustavo/Apps/IFSC/IFSC-redes-I/apps/udp-iot
npm run build:all
echo "Full build OK"
```
