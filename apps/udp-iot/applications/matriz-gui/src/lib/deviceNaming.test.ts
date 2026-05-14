import { describe, expect, it } from "vitest";
import {
	humanizeDeviceId,
	makeAliasKey,
	resolveConfigAlias,
	resolveDeviceName,
} from "./deviceNaming";

describe("deviceNaming", () => {
	it("prioriza alias da UI", () => {
		expect(resolveDeviceName("sensor_temp_1", "Sala", "Temperatura Sala")).toBe("Sala");
	});

	it("usa alias de config quando nao ha alias UI", () => {
		expect(resolveDeviceName("sensor_temp_1", "", "Temperatura Sala")).toBe("Temperatura Sala");
	});

	it("humaniza id como fallback", () => {
		expect(humanizeDeviceId("sensor_kitchen_temp_1")).toContain("Sensor de Temperatura");
	});

	it("gera chave estavel de alias", () => {
		expect(makeAliasKey(" 192.168.0.10 ", " sensor_temp_1 ")).toBe("192.168.0.10::sensor_temp_1");
	});

	it("resolve alias por filial antes do global", () => {
		const local = {
			"192.168.0.10": { sensor_temp_1: "Temp Cozinha" },
		};
		const global = { sensor_temp_1: "Temperatura" };
		expect(resolveConfigAlias("192.168.0.10", "sensor_temp_1", local, global)).toBe("Temp Cozinha");
		expect(resolveConfigAlias("192.168.0.20", "sensor_temp_1", local, global)).toBe("Temperatura");
	});
});
