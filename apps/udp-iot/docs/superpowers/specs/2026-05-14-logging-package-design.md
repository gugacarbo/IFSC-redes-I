# Logging Package Design

**Date:** 2026-05-14
**Status:** Draft

## Overview

Create a shared `logging` package under `apps/udp-iot/packages/logging/` with structured loggers for Java and TypeScript, replacing raw `System.out.println` / `console.log` calls across both matrix and filial applications.

## Package Structure

```
packages/logging/
├── java/
│   └── src/lib/logging/
│       ├── Logger.java
│       ├── LogLevel.java
│       ├── ConsoleHandler.java
│       ├── FileHandler.java
│       └── LogConfig.java
└── ts/
    ├── src/
    │   └── logger.ts
    ├── package.json
    └── tsconfig.json
```

## Java — Package & Imports

- **Package:** `lib.logging`
- **Import:** `import lib.logging.Logger;`
- **Usage variable name:** `logger` (not `log`)

```java
import lib.logging.Logger;
import lib.logging.LogLevel;

class FilialMain {
    private static final Logger logger = Logger.getLogger(FilialMain.class);

    void start() {
        logger.info("Server starting on port {}", port);
        logger.debug("Device count: {}", count);
        logger.error("Failed to bind: {}", e.getMessage());
    }
}
```

## TypeScript — Package & Imports

- **Package name:** `@lib/logging`
- **Import:** `import { Logger } from "@lib/logging";`
- **Usage variable name:** `logger`

```typescript
import { Logger } from "@lib/logging";

const logger = Logger.getLogger("BridgeManager");
logger.info("Client connected");
logger.debug("Session data: %o", data);
logger.error("Connection failed", err);
```

## Log Levels

| Level   | Purpose                        |
|---------|--------------------------------|
| DEBUG   | Detailed diagnostics           |
| INFO    | Normal operational messages    |
| WARN    | Something unexpected           |
| ERROR   | Failure but app continues      |

## Output Handlers

### ConsoleHandler
- Writes to stdout (INFO, WARN, DEBUG) and stderr (ERROR)
- Compatible with existing `LogCapture` — logs still appear in WebSocket GUI

### FileHandler
- Writes to file specified by env var `LOG_FILE` (default: `app.log`)
- Auto-rotation: when file exceeds `LOG_FILE_MAX_SIZE` (default: `10MB`), renames to `app.log.1`, `app.log.2`, etc.
- Max backups controlled by `LOG_FILE_MAX_BACKUPS` (default: 5)
- Default: only enabled when `LOG_FILE` is set

## Configuration (via Env Vars)

| Variable             | Default     | Description               |
|----------------------|-------------|---------------------------|
| `LOG_LEVEL`          | `INFO`      | Minimum level to output   |
| `LOG_FILE`           | *(empty)*   | Log file path (off if empty) |
| `LOG_FILE_MAX_SIZE`  | `10MB`      | Max size before rotation   |
| `LOG_FILE_MAX_BACKUPS` | `5`       | Max rotated files kept     |

## Log Format

```
[2026-05-14 10:30:00] [INFO] [FilialMain] Server starting on port 8080
[2026-05-14 10:30:01] [DEBUG] [DeviceManager] Device count: 8
[2026-05-14 10:30:02] [ERROR] [UdpServer] Failed to bind socket: Address already in use
```

## Classpath Integration

Both `filial-java` and `matriz-java` need one line added to their `run-java.cjs`:

```js
const loggingSrcDir = path.join("..", "..", "packages", "logging", "java", "src");
```

Included in both `sourceClasspath` (compile) and `runtimeClasspath` (runtime).

## Scope

This spec covers **only** the `packages/logging/` library itself and the classpath changes. Replacing existing `System.out.println` calls with the new logger is a separate implementation step.
