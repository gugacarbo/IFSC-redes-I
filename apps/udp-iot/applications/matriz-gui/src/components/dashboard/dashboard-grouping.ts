import { extractPlace } from "../../lib/device-utils";
import { isSensorDevice } from "../../lib/deviceNaming";

export function groupByLocation(devices: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>();
	for (const dev of devices) {
		const place = extractPlace(dev);
		if (!groups.has(place)) groups.set(place, []);
		groups.get(place)!.push(dev);
	}
	return groups;
}

export function groupByType(
	devices: string[],
): Map<string, Map<string, string[]>> {
	const sensor = new Map<string, string[]>();
	const actuator = new Map<string, string[]>();
	for (const dev of devices) {
		const place = extractPlace(dev);
		const target = isSensorDevice(dev) ? sensor : actuator;
		if (!target.has(place)) target.set(place, []);
		target.get(place)!.push(dev);
	}
	const groups = new Map<string, Map<string, string[]>>();
	groups.set("Sensor", sensor);
	groups.set("Atuador", actuator);
	return groups;
}
