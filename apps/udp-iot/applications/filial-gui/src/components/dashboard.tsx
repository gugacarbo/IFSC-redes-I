import { Button } from "@udp-iot/ui/components/button";
import { Layers, Lightbulb, MapPin, Snowflake } from "lucide-react";
import { useState } from "react";
import type { DeviceInfo } from "../types";
import { extractPlace, toNormalCase } from "../lib/device-utils";
import { DeviceCard } from "./dashboard/device-card";

interface DashboardProps {
	devices: DeviceInfo[];
	onSetDevice: (id: string, value: boolean | number) => void;
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
									<h3 className="mb-2 flex items-center gap-1 pl-1 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/70">
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
