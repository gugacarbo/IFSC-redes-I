/**
 * Humanizes a raw ESP32 device ID into a readable name.
 *
 * Strategy:
 * - light: "Light" for "light", "Sensor de Temp" for "temp"
 * - Room suffix appended when recognized (e.g. "Light — Sala")
 */
export function humanizeDeviceId(id: string): string {
	if (!id || typeof id !== "string") return "";

	const nameMap: Record<string, string> = {
		living_room: "Sala",
		bedroom: "Quarto",
		kitchen: "Cozinha",
		garage: "Garagem",
		bathroom: "Banheiro",
		office: "Escritorio",
		hall: "Corredor",
		outdoor: "Externo",
		front_door: "Porta da Frente",
		backyard: "Quintal",
	};

	function toNormalCase(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	const typeMap: Record<string, string> = {};
	for (const k of ["light", "fan", "lamp", "bulb", "motor", "pump", "valve", "switch", "relay", "led", "strip"]) {
		typeMap[k] = toNormalCase(k);
	}

	const sensorMap: Record<string, string> = {};
	for (const k of ["temp", "temperature", "humidity", "hum", "motion", "pir", "gas", "smoke", "light_sensor", "lux", "door", "window", "water", "leak"]) {
		sensorMap[k] = toNormalCase(k);
	}

	// Split by underscore and remove numeric suffixes at end
	const tokens = id
		.toLowerCase()
		.split("_")
		.filter((t) => t && !/^\d+$/.test(t));

	// Check if it's a sensor
	if (tokens.includes("sensor") || tokens[0] === "sensor") {
		const roomTokens = tokens.filter((t) => nameMap[t]);
		const room = roomTokens.map((t) => nameMap[t]).join(" ") || "";

		const sensorTokens = tokens.filter((t) => sensorMap[t]);
		const sensorType = sensorTokens.map((t) => sensorMap[t]).join(" e ") || "";

		if (room && sensorType) {
			return `Sensor de ${sensorType} — ${room}`;
		}
		if (sensorType) {
			return `Sensor de ${sensorType}`;
		}
	}

	// Non-sensor devices
	const roomTokens = tokens.filter((t) => nameMap[t]);
	const room = roomTokens.map((t) => nameMap[t]).join(" ") || "";

	const typeTokens = tokens.filter((t) => typeMap[t]);
	const type = typeTokens.map((t) => typeMap[t]).join(" ") || "";

	if (room && type) {
		return `${type} — ${room}`;
	}
	if (room) {
		return room;
	}
	if (type) {
		return type;
	}

	// Fallback: capitalize each token
	return tokens.map((t) => toNormalCase(t)).join(" ");
}

/**
 * Resolves the display name for a device with cascading fallback:
 * 1. UI alias (localStorage) — highest priority
 * 2. Config alias (from server config file)
 * 3. Humanized automatic name (from device ID)
 * 4. Raw device ID — last resort
 */
export function resolveDeviceName(
	deviceId: string,
	uiAlias?: string | null,
	configAlias?: string | null,
): string {
	if (uiAlias?.trim()) {
		return uiAlias.trim();
	}
	if (configAlias?.trim()) {
		return configAlias.trim();
	}
	const humanized = humanizeDeviceId(deviceId);
	if (humanized && humanized !== deviceId) {
		return humanized;
	}
	return deviceId;
}

export function makeAliasKey(ip: string, deviceId: string): string {
	return `${ip.trim()}::${deviceId.trim()}`;
}

export function resolveConfigAlias(
	ip: string,
	deviceId: string,
	byIp?: Record<string, Record<string, string>>,
	global?: Record<string, string>,
): string | undefined {
	const filialAlias = byIp?.[ip]?.[deviceId]?.trim();
	if (filialAlias) {
		return filialAlias;
	}

	const globalAlias = global?.[deviceId]?.trim();
	return globalAlias || undefined;
}

/**
 * Humanizes a raw ESP32 device ID for a sensor, returning empty string if not a sensor.
 */
export function humanizeSensorId(id: string): string {
	if (!id || typeof id !== "string") return "";
	const tokens = id.toLowerCase().split("_");
	if (!tokens.includes("sensor") && tokens[0] !== "sensor") {
		return "";
	}
	return humanizeDeviceId(id);
}

/**
 * Checks if a device ID represents a light (has "_light_").
 */
export function isLightDevice(id: string): boolean {
	return id.includes("_light_");
}

/**
 * Checks if a device ID represents a sensor (starts with "sensor_").
 */
export function isSensorDevice(id: string): boolean {
	return id.startsWith("sensor_");
}
