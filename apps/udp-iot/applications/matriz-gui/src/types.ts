export interface FilialConfig {
  name: string;
  ip: string;
  port: number;
}

export interface AppConfig {
  user: string;
  pass: string;
  pollingMs: number;
  filiais: FilialConfig[];
  deviceAliases?: Record<string, string>;
  deviceAliasesByIp?: Record<string, Record<string, string>>;
}

export interface FilialData {
  ip: string;
  name: string;
  devices: string[];
  state: Record<string, boolean | number>;
  lastSeen: number;
}

export interface LogEntry {
  level: "info" | "error";
  message: string;
  ts: number;
}
