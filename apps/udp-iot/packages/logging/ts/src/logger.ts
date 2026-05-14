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
    const parts: string[] = [];
    let argIdx = 0;
    let start = 0;
    while (true) {
      const brace = template.indexOf("{}", start);
      if (brace === -1) break;
      parts.push(template.slice(start, brace));
      parts.push(argIdx < args.length ? String(args[argIdx++] ?? "") : "{}");
      start = brace + 2;
    }
    parts.push(template.slice(start));
    return parts.join("");
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
