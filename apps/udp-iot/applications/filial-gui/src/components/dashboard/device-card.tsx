import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Progress } from "@udp-iot/ui/components/progress";
import { Slider } from "@udp-iot/ui/components/slider";
import { Switch } from "@udp-iot/ui/components/switch";
import { Lightbulb, Snowflake } from "lucide-react";
import type { DeviceInfo } from "../../types";

interface DeviceCardProps {
	device: DeviceInfo;
	onSetDevice: (id: string, value: boolean | number) => void;
}

export function DeviceCard({ device, onSetDevice }: DeviceCardProps) {
	const Icon = device.isLight ? Lightbulb : Snowflake;
	const typeLabel = device.isSensor ? "Sensor" : "Atuador";
	const typeVariant = device.isSensor ? "secondary" : "default";
	const place = device.id.split("_").slice(2).join("_") || device.id;

	return (
		<Card size="sm">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<Icon className="size-5 text-muted-foreground" />
						<CardTitle className="mt-1">{place}</CardTitle>
						<p className="text-xs text-muted-foreground font-mono">
							{device.id}
						</p>
					</div>
					<Badge variant={typeVariant}>{typeLabel}</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{device.isLight ? (
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Estado</span>
						<div className="flex items-center gap-2">
							<span
								className={`inline-block size-3 rounded-full ${device.boolValue ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" : "bg-muted"}`}
							/>
							<span className="text-sm font-medium">
								{device.boolValue ? "LIGADO" : "DESLIGADO"}
							</span>
						</div>
					</div>
				) : device.isSensor ? (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Valor</span>
							<span className="text-sm font-medium">{device.intValue}</span>
						</div>
						<Progress value={(device.intValue / 1023) * 100} />
					</div>
				) : (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Valor</span>
							<span className="text-sm font-medium">{device.intValue}</span>
						</div>
						<Slider
							value={[device.intValue]}
							onValueChange={([v]) => onSetDevice(device.id, v)}
							min={0}
							max={1023}
							disabled={device.isSensor}
						/>
					</div>
				)}

				{!device.isSensor && device.isLight && (
					<div className="mt-3 flex items-center justify-between">
						<Switch
							checked={device.boolValue}
							onCheckedChange={(v) => onSetDevice(device.id, v)}
						/>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onSetDevice(device.id, !device.boolValue)}
						>
							{device.boolValue ? "Desligar" : "Ligar"}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
