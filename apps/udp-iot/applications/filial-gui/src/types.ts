export interface DeviceInfo {
  id: string;
  isLight: boolean;
  isSensor: boolean;
  boolValue: boolean;
  intValue: number;
}

export interface ServerConfig {
  port: number;
  adminUser: string;
  adminPass: string;
}

export interface LogEntry {
  level: "info" | "error";
  message: string;
  ts: number;
}
