export interface DeviceState {
  isLight: boolean;
  isSensor: boolean;
  boolValue: boolean;
  intValue: number;
}

interface Config {
  port: number;
  adminUser: string;
  adminPass: string;
}

export class DeviceManager {
  private devices: Map<string, DeviceState>;
  private config: Config;

  constructor() {
    this.devices = new Map();
    this.config = { port: 51000, adminUser: "admin", adminPass: "admin" };
  }

  init(deviceIds: string[]): void {
    for (const id of deviceIds) {
      this.devices.set(id, {
        isLight: DeviceManager.isLight(id),
        isSensor: DeviceManager.isSensor(id),
        boolValue: DeviceManager.isLight(id) ? Math.random() > 0.5 : false,
        intValue: !DeviceManager.isLight(id) ? Math.floor(Math.random() * 1024) : 0,
      });
    }
  }

  get(id: string): DeviceState | undefined {
    return this.devices.get(id);
  }

  set(id: string, value: boolean): void;
  set(id: string, value: number): void;
  set(id: string, value: boolean | number): void {
    const device = this.devices.get(id);
    if (!device) return;
    if (device.isLight) {
      device.boolValue = value as boolean;
    } else {
      device.intValue = Math.max(0, Math.min(1023, value as number));
    }
  }

  list(): string[] {
    return Array.from(this.devices.keys());
  }

  getAll(): Record<string, DeviceState> {
    const result: Record<string, DeviceState> = {};
    for (const [id, state] of this.devices) {
      result[id] = { ...state };
    }
    return result;
  }

  count(): number {
    return this.devices.size;
  }

  addDevice(id: string): void {
    if (this.devices.has(id)) return;
    this.devices.set(id, {
      isLight: DeviceManager.isLight(id),
      isSensor: DeviceManager.isSensor(id),
      boolValue: DeviceManager.isLight(id) ? false : false,
      intValue: !DeviceManager.isLight(id) ? 0 : 0,
    });
  }

  removeDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  updateDevice(oldId: string, newId: string): boolean {
    const state = this.devices.get(oldId);
    if (!state) return false;
    this.devices.set(newId, { ...state });
    this.devices.delete(oldId);
    return true;
  }

  getConfig(): Config {
    return { ...this.config };
  }

  setConfig(port: number, user: string, pass: string): void {
    this.config = { port, adminUser: user, adminPass: pass };
  }

  static isLight(id: string): boolean {
    return id.includes("_light_");
  }

  static isSensor(id: string): boolean {
    return id.startsWith("sensor_");
  }
}
