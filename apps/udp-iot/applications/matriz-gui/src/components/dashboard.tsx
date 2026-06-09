import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Input } from "@udp-iot/ui/components/input";
import { Progress } from "@udp-iot/ui/components/progress";
import { Slider } from "@udp-iot/ui/components/slider";
import { Switch } from "@udp-iot/ui/components/switch";
import {
	Check,
	Layers,
	MapPin,
	Pencil,
	Power,
	PowerOff,
	RotateCcw,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDeviceAliases } from "../hooks/useDeviceAliases";
import {
	isLightDevice,
	isSensorDevice,
	resolveConfigAlias,
	resolveDeviceName,
} from "../lib/deviceNaming";
import type { AppConfig, FilialData } from "../types";

type GroupMode = "location" | "type";

function extractPlace(id: string): string {
	return id.split("_").slice(2).join("_");
}

function toNormalCase(s: string): string {
	return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DeviceCard({
	dev,
	ip,
	state,
	config,
	getAlias,
	editingKey,
	draftAlias,
	onCommand,
	onBeginEdit,
	onSaveEdit,
	onCancelEdit,
	onClearAlias,
	setDraftAlias,
}: {
	dev: string;
	ip: string;
	state: Record<string, boolean | number>;
	config: AppConfig | null;
	getAlias: (ip: string, dev: string) => string | null;
	editingKey: string | null;
	draftAlias: string;
	onCommand: (ip: string, id: string, val: boolean | number) => void;
	onBeginEdit: (ip: string, dev: string, label: string) => void;
	onSaveEdit: (ip: string, dev: string) => void;
	onCancelEdit: () => void;
	onClearAlias: (ip: string, dev: string) => void;
	setDraftAlias: (v: string) => void;
}) {
	const isLight = isLightDevice(dev);
	const isSensor = isSensorDevice(dev);
	const isLightSensor =
		isSensor && (dev.includes("light") || dev.includes("lux"));
	const val = state[dev];
	const sensorValue = Number(val || 0);
	const editKey = `${ip}::${dev}`;
	const uiAlias = getAlias(ip, dev);
	const configAlias = resolveConfigAlias(
		ip,
		dev,
		config?.deviceAliasesByIp,
		config?.deviceAliases,
	);
	const displayName = resolveDeviceName(dev, uiAlias, configAlias);
	const editing = editingKey === editKey;

	return (
		<div className="rounded-2xl border bg-card/70 px-4 py-3 backdrop-blur-sm">
			<div className="mb-2 flex items-start justify-between gap-2">
				<div className="min-w-0">
					{editing ? (
						<Input
							value={draftAlias}
							onChange={(e) => setDraftAlias(e.target.value)}
							className="h-8"
							autoFocus
						/>
					) : (
						<p className="text-sm font-semibold truncate">{displayName}</p>
					)}
					<p className="text-[11px] font-mono text-muted-foreground truncate">
						{dev}
					</p>
				</div>

				<div className="flex items-center gap-1">
					{editing ? (
						<>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => onSaveEdit(ip, dev)}
							>
								<Check className="h-4 w-4" />
							</Button>
							<Button size="icon" variant="ghost" onClick={onCancelEdit}>
								<X className="h-4 w-4" />
							</Button>
						</>
					) : (
						<>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => onBeginEdit(ip, dev, displayName)}
							>
								<Pencil className="h-4 w-4" />
							</Button>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => onClearAlias(ip, dev)}
							>
								<RotateCcw className="h-4 w-4" />
							</Button>
						</>
					)}
				</div>
			</div>

			{isLightSensor ? (
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
			) : isLight ? (
				<Switch
					checked={Boolean(val)}
					onCheckedChange={(v) => onCommand(ip, dev, v)}
				/>
			) : isSensor ? (
				<div className="flex items-center gap-3">
					<Progress
						value={((val as number) || 0) / 10.23}
						className="h-2.5 flex-1"
					/>
					<span className="text-xs font-mono text-muted-foreground w-12 text-right tabular-nums">
						{val ?? 0}
					</span>
				</div>
			) : (
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
			)}
		</div>
	);
}

function groupByLocation(devices: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>();
	for (const dev of devices) {
		const place = extractPlace(dev);
		if (!groups.has(place)) groups.set(place, []);
		groups.get(place)!.push(dev);
	}
	return groups;
}

function groupByType(
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

export function Dashboard({
	filiais,
	config,
	onCommand,
}: {
	filiais: Record<string, FilialData>;
	config: AppConfig | null;
	onCommand: (ip: string, id: string, val: boolean | number) => void;
}) {
	const entries = Object.values(filiais);
	const { getAlias, setAlias, clearAlias } = useDeviceAliases();
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [draftAlias, setDraftAlias] = useState("");
	const defaultGroup = useMemo<GroupMode>(() => {
		const allDevices = entries.flatMap((f) => f.devices);
		const places = new Set(allDevices.map(extractPlace));
		return places.size > 1 ? "location" : "type";
	}, [entries]);
	const [groupMode, setGroupMode] = useState<GroupMode | null>(null);
	const effectiveGroup = groupMode ?? defaultGroup;

	const beginEdit = (ip: string, dev: string, currentLabel: string) => {
		setEditingKey(`${ip}::${dev}`);
		setDraftAlias(currentLabel);
	};

	const saveEdit = (ip: string, dev: string) => {
		setAlias(ip, dev, draftAlias);
		setEditingKey(null);
		setDraftAlias("");
	};

	const cancelEdit = () => {
		setEditingKey(null);
		setDraftAlias("");
	};

	const sharedDeviceProps = {
		config,
		getAlias,
		editingKey,
		draftAlias,
		onCommand,
		onBeginEdit: beginEdit,
		onSaveEdit: saveEdit,
		onCancelEdit: cancelEdit,
		onClearAlias: clearAlias,
		setDraftAlias,
	};

	if (entries.length === 0) {
		return (
			<div className="text-center p-12 text-muted-foreground">
				Aguardando dados das filiais...
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			{entries.map((filial) => {
				const isOffline = Date.now() - filial.lastSeen > 15000;

				const byLocation = groupByLocation(filial.devices);
				const byType = groupByType(filial.devices);

				return (
					<Card
						key={filial.ip}
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
										onClick={() => setGroupMode("location")}
									>
										<MapPin className="size-3.5" />
										Local
									</Button>
									<Button
										variant={effectiveGroup === "type" ? "default" : "ghost"}
										size="xs"
										onClick={() => setGroupMode("type")}
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
														{[...placeGroups.entries()].map(
															([place, devs]) => (
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
															),
														)}
													</div>
												</div>
											) : null,
										)}
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
