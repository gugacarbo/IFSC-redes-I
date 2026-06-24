import { Lightbulb, Snowflake, ToggleLeft } from "lucide-react";
import type { DeviceInfo } from "../../types";

export function DeviceIcon({ device }: { device: DeviceInfo }) {
	if (device.isLight && !device.isSensor) {
		return <ToggleLeft className="size-4 text-muted-foreground" />;
	}
	if (device.isLight) {
		return <Lightbulb className="size-4 text-muted-foreground" />;
	}
	return <Snowflake className="size-4 text-muted-foreground" />;
}
