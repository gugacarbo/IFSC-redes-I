import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Layers, MapPin } from "lucide-react";
import { toNormalCase } from "../../lib/device-utils";
import type { AppConfig, FilialData } from "../../types";
import { DeviceCard } from "./device-card";
import type { DeviceCardProps } from "./device-card";
import { groupByLocation, groupByType } from "./dashboard-grouping";

export function FilialCard({
	filial,
	config,
	effectiveGroup,
	sharedDeviceProps,
	onGroupMode,
}: {
	filial: FilialData;
	config: AppConfig | null;
	effectiveGroup: "location" | "type";
	sharedDeviceProps: Omit<DeviceCardProps, "dev" | "ip" | "state">;
	onGroupMode: (mode: "location" | "type") => void;
}) {
	const isOffline = Date.now() - filial.lastSeen > 15000;
	const byLocation = groupByLocation(filial.devices);
	const byType = groupByType(filial.devices);

	return (
		<Card
			size="sm"
			className={`border-0 shadow-md ${isOffline ? "opacity-70" : ""}`}
		>
			<CardHeader>
				<div className="flex justify-between items-start gap-3">
					<div>
						<CardTitle className="text-xl">{filial.name}</CardTitle>
						<span className="text-xs text-muted-foreground font-mono tracking-wide">
							{filial.ip}
						</span>
					</div>
					<Badge variant={isOffline ? "destructive" : "outline"}>
						{isOffline ? "Offline" : "Online"}
					</Badge>
				</div>
				{filial.devices.length > 0 && (
					<div className="flex gap-0.5 rounded bg-muted p-0.5 self-start mt-3">
						<Button
							variant={effectiveGroup === "location" ? "default" : "ghost"}
							size="xs"
							onClick={() => onGroupMode("location")}
						>
							<MapPin className="size-3.5" />
							Local
						</Button>
						<Button
							variant={effectiveGroup === "type" ? "default" : "ghost"}
							size="xs"
							onClick={() => onGroupMode("type")}
						>
							<Layers className="size-3.5" />
							Tipo
						</Button>
					</div>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-3">
					{filial.devices.length === 0 && (
						<div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
							Sem dispositivos reportados ainda.
						</div>
					)}
					{effectiveGroup === "location"
						? [...byLocation.entries()].map(([place, devs]) => (
								<div key={place}>
									<h3 className="mb-2 flex items-center gap-1.5 text-xs font-heading font-semibold tracking-wider uppercase text-muted-foreground">
										<MapPin className="size-3.5" />
										{toNormalCase(place)}
									</h3>
									<div className="flex flex-col gap-2">
										{devs.map((dev) => (
											<DeviceCard
												key={dev}
												dev={dev}
												ip={filial.ip}
												state={filial.state}
												{...sharedDeviceProps}
											/>
										))}
									</div>
								</div>
							))
						: [...byType.entries()].map(([typeName, placeGroups]) =>
								placeGroups.size > 0 ? (
									<div key={typeName}>
										<h3 className="mb-2 flex items-center gap-1.5 text-xs font-heading font-semibold tracking-wider uppercase text-muted-foreground">
											<Layers className="size-3.5" />
											{typeName}
										</h3>
										<div className="flex flex-col gap-3 mb-4 last:mb-0">
											{[...placeGroups.entries()].map(([place, devs]) => (
												<div key={place}>
													<h4 className="mb-1.5 pl-1 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/70">
														{toNormalCase(place)}
													</h4>
													<div className="flex flex-col gap-2">
														{devs.map((dev) => (
															<DeviceCard
																key={dev}
																dev={dev}
																ip={filial.ip}
																state={filial.state}
																{...sharedDeviceProps}
															/>
														))}
													</div>
												</div>
											))}
										</div>
									</div>
								) : null,
							)}
				</div>
			</CardContent>
		</Card>
	);
}
