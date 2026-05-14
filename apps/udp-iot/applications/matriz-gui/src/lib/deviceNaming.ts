/**
 * Humanizes a raw ESP32 device ID into a readable name.
 *
 * Strategy:
 * - light: "LED da Sala" for "living_room_light_1"
 * - fan: "Ventilador" for "bedroom_fan"
 * - sensor: "Sensor de Temperatura" for "garage_temp_sensor"
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

	const typeMap: Record<string, string> = {
		light: "LED",
		fan: "Ventilador",
		lamp: "Lampada",
		bulb: "Lampada",
		motor: "Motor",
		pump: "Bomba",
		valve: "Valvula",
		switch: "Interruptor",
		relay: "Rele",
		led: "LED",
		strip: "Fita",
	};

	const sensorMap: Record<string, string> = {
		temp: "Temperatura",
		temperature: "Temperatura",
		humidity: "Umidade",
		hum: "Umidade",
		motion: "Presenca",
		pir: "Presenca",
		gas: "Gas",
		smoke: "Fumaca",
		light_sensor: "Luminosidade",
		lux: "Luminosidade",
		door: "Porta",
		window: "Janela",
		water: "Agua",
		leak: "Vazamento",
	};

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
		const sensorType =
			sensorTokens.map((t) => sensorMap[t]).join(" e ") || "";

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
	return tokens
		.map((t) => t.charAt(0).toUpperCase() + t.slice(1))
		.join(" ");
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
	if (uiAlias && uiAlias.trim()) {
		return uiAlias.trim();
	}
	if (configAlias && configAlias.trim()) {
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
