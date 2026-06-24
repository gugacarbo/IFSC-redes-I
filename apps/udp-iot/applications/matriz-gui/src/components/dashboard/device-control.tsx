import { Progress } from "@udp-iot/ui/components/progress";
import { Slider } from "@udp-iot/ui/components/slider";
import { Switch } from "@udp-iot/ui/components/switch";
import { Power, PowerOff } from "lucide-react";

export function DeviceControl({
	dev,
	val,
	onCommand,
	ip,
}: {
	dev: string;
	val: boolean | number | undefined;
	onCommand: (ip: string, id: string, val: boolean | number) => void;
	ip: string;
}) {
	const isSensor = dev.startsWith("sensor_");
	const isLightSensor = isSensor && (dev.includes("light") || dev.includes("lux"));
	const sensorValue = Number(val || 0);

	if (isLightSensor) {
		return (
			<div className="flex items-center justify-between gap-3 rounded-xl border bg-amber-50/70 px-3 py-2 dark:bg-amber-950/20">
				<div className="flex items-center gap-2">
					<div
						className={`h-2.5 w-2.5 rounded-full ${
							sensorValue > 0 ? "bg-emerald-500" : "bg-zinc-400"
						}`}
					/>
					<span
						className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
							sensorValue > 0
								? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
								: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
						}`}
					>
						{sensorValue > 0 ? (
							<Power className="h-3 w-3" />
						) : (
							<PowerOff className="h-3 w-3" />
						)}
						{sensorValue > 0 ? "Ligado" : "Desligado"}
					</span>
				</div>
				<span className="text-xs font-mono text-muted-foreground tabular-nums">
					{sensorValue}
				</span>
			</div>
		);
	}

	if (dev.includes("_light_")) {
		return (
			<Switch
				checked={Boolean(val)}
				onCheckedChange={(v) => onCommand(ip, dev, v)}
			/>
		);
	}

	if (isSensor) {
		return (
			<div className="flex items-center gap-3">
				<Progress
					value={((val as number) || 0) / 10.23}
					className="h-2.5 flex-1"
				/>
				<span className="text-xs font-mono text-muted-foreground w-12 text-right tabular-nums">
					{val ?? 0}
				</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<Slider
				value={[(val as number) || 0]}
				onValueChange={([v]) => onCommand(ip, dev, v)}
				min={0}
				max={1023}
				className="flex-1"
			/>
			<span className="text-xs font-mono text-muted-foreground w-12 text-right tabular-nums">
				{val ?? 0}
			</span>
		</div>
	);
}
