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
import { Layers, Lightbulb, MapPin, Snowflake } from "lucide-react";
import { useState } from "react";
import type { DeviceInfo } from "../types";

interface DashboardProps {
	devices: DeviceInfo[];
	onSetDevice: (id: string, value: boolean | number) => void;
}

function extractPlace(id: string): string {
	return id.split("_").slice(2).join("_");
}

function toNormalCase(id: string): string {
	const place = extractPlace(id).replace(/_/g, " ");
	return place.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Dashboard({ devices, onSetDevice }: DashboardProps) {
	const [groupBy, setGroupBy] = useState<"place" | "type">("place");

	if (devices.length === 0) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				Nenhum dispositivo cadastrado.
			</div>
		);
	}

	const grouped = devices.reduce(
		(acc, device) => {
			const key =
				groupBy === "place"
					? extractPlace(device.id)
					: device.isLight
						? "Luz"
						: "Climatização";
			if (!acc.has(key)) acc.set(key, []);
			acc.get(key)!.push(device);
			return acc;
		},
		new Map<string, DeviceInfo[]>(),
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex gap-0.5 rounded bg-muted p-0.5 self-start">
				<Button
					variant={groupBy === "place" ? "default" : "ghost"}
					size="xs"
					onClick={() => setGroupBy("place")}
				>
					<MapPin className="size-3.5" />
					Local
				</Button>
				<Button
					variant={groupBy === "type" ? "default" : "ghost"}
					size="xs"
					onClick={() => setGroupBy("type")}
				>
					<Layers className="size-3.5" />
					Tipo
				</Button>
			</div>

			{[...grouped.entries()].map(([groupKey, groupDevices]) => (
				<div key={groupKey}>
					<h2 className="mb-3 flex items-center gap-1.5 text-xs font-heading font-semibold tracking-wider uppercase text-muted-foreground">
						{groupBy === "type" ? (
							groupKey === "Luz" ? (
								<Lightbulb className="size-3.5" />
							) : (
								<Snowflake className="size-3.5" />
							)
						) : (
							<MapPin className="size-3.5" />
						)}
						{groupKey === "Luz" || groupKey === "Climatização"
							? groupKey
							: toNormalCase(groupKey)}
					</h2>
					{groupBy === "type" ? (
						<div className="flex flex-col gap-6">
							{[...groupDevices.reduce(
								(subAcc, device) => {
									const place = extractPlace(device.id);
									if (!subAcc.has(place)) subAcc.set(place, []);
									subAcc.get(place)!.push(device);
									return subAcc;
								},
								new Map<string, DeviceInfo[]>(),
							).entries()].map(([place, placeDevices]) => (
								<div key={place}>
									<h3 className="mb-2 pl-1 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/70">
										<MapPin className="size-3" />
										{toNormalCase(place)}
									</h3>
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{placeDevices.map((device) => (
											<DeviceCard
												key={device.id}
												device={device}
												onSetDevice={onSetDevice}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{groupDevices.map((device) => (
								<DeviceCard
									key={device.id}
									device={device}
									onSetDevice={onSetDevice}
								/>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
}

function DeviceCard({
	device,
	onSetDevice,
}: {
	device: DeviceInfo;
	onSetDevice: (id: string, value: boolean | number) => void;
}) {
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
