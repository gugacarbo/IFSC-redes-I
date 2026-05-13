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
}

export interface FilialData {
  ip: string;
  name: string;
  devices: string[];
  state: Record<string, boolean | number>;
  lastSeen: number;
}
