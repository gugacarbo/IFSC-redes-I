import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@udp-iot/ui/components/dialog";
import { Input } from "@udp-iot/ui/components/input";
import { Lightbulb, Pencil, Plus, Snowflake, ToggleLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import type { DeviceInfo } from "../types";

interface DeviceEditorProps {
	devices: DeviceInfo[];
	onAdd: (id: string) => void;
	onRemove: (id: string) => void;
	onRename: (oldId: string, newId: string) => void;
}

type DeviceType = "light" | "ac";
type AccessType = "actuator" | "sensor";

function extractPlace(id: string): string {
	return id.split("_").slice(2).join("_");
}

function toNormalCase(id: string): string {
	const place = extractPlace(id).replace(/_/g, " ");
	return place.replace(/\b\w/g, (c) => c.toUpperCase());
}

function DeviceIcon({ device }: { device: DeviceInfo }) {
	if (device.isLight && !device.isSensor) {
		return <ToggleLeft className="size-4 text-muted-foreground" />;
	}
	if (device.isLight) {
		return <Lightbulb className="size-4 text-muted-foreground" />;
	}
	return <Snowflake className="size-4 text-muted-foreground" />;
}

interface DeviceItemProps {
	device: DeviceInfo;
	isRenaming: boolean;
	newName: string;
	setNewName: (v: string) => void;
	onRename: () => void;
	onCancelRename: () => void;
	onStartRename: () => void;
	onRemove: () => void;
}

function DeviceItem({
	device,
	isRenaming,
	newName,
	setNewName,
	onRename,
	onCancelRename,
	onStartRename,
	onRemove,
}: DeviceItemProps) {
	if (isRenaming) {
		return (
			<li className="flex items-center justify-between rounded bg-muted px-3 py-2">
				<div className="flex flex-1 items-center gap-2">
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						autoFocus
						onKeyDown={(e) => {
							if (e.key === "Enter") onRename();
							if (e.key === "Escape") onCancelRename();
						}}
					/>
					<Button size="sm" onClick={onRename}>OK</Button>
					<Button variant="outline" size="sm" onClick={onCancelRename}>
						Cancelar
					</Button>
				</div>
			</li>
		);
	}

	return (
		<li className="flex items-center justify-between rounded bg-muted px-3 py-2">
			<div className="flex items-center gap-2">
				<DeviceIcon device={device} />
				<div>
					<span className="text-sm font-medium">
						{toNormalCase(device.id)}
					</span>
					<span className="block text-xs font-mono text-muted-foreground">
						{device.id}
					</span>
				</div>
			</div>
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onStartRename}
					title="Renomear"
				>
					<Pencil className="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onRemove}
					title="Remover"
					className="text-destructive hover:text-destructive"
				>
					<Trash2 className="size-3.5" />
				</Button>
			</div>
		</li>
	);
}

export function DeviceEditor({
	devices,
	onAdd,
	onRemove,
	onRename,
}: DeviceEditorProps) {
	const [deviceType, setDeviceType] = useState<DeviceType>("light");
	const [accessType, setAccessType] = useState<AccessType>("actuator");
	const [place, setPlace] = useState("");
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [newName, setNewName] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [groupBy, setGroupBy] = useState<"place" | "type">("place");

	const generatedId = `${accessType}_${deviceType}_${place || "..."}`;
	const isValid = place.trim().length > 0;

	function handleAdd() {
		if (!isValid) return;
		onAdd(generatedId);
		setPlace("");
		setDeviceType("light");
		setAccessType("actuator");
		setDialogOpen(false);
	}

	function handleRename(oldId: string) {
		if (!newName.trim()) return;
		const parts = oldId.split("_");
		const prefix = parts.slice(0, 2).join("_");
		onRename(oldId, `${prefix}_${newName.trim()}`);
		setRenamingId(null);
		setNewName("");
	}

	function handleRemove(id: string) {
		if (window.confirm(`Remover dispositivo "${id}"?`)) {
			onRemove(id);
		}
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

	function renderDeviceItem(device: DeviceInfo) {
		return (
			<DeviceItem
				key={device.id}
				device={device}
				isRenaming={renamingId === device.id}
				newName={newName}
				setNewName={setNewName}
				onRename={() => handleRename(device.id)}
				onCancelRename={() => {
					setRenamingId(null);
					setNewName("");
				}}
				onStartRename={() => {
					const parts = device.id.split("_");
					setRenamingId(device.id);
					setNewName(parts.slice(2).join("_"));
				}}
				onRemove={() => handleRemove(device.id)}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Device List */}
			<Card size="sm">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Dispositivos ({devices.length})</CardTitle>
						<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Button size="sm">
									<Plus className="size-4" />
									Adicionar
								</Button>
							</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Adicionar Dispositivo</DialogTitle>
									</DialogHeader>
									<div className="flex flex-col gap-4">
										<div>
											<span className="mb-1 block text-sm text-muted-foreground">
												Tipo
											</span>
											<div className="flex gap-2">
												<Button
													variant={deviceType === "light" ? "default" : "outline"}
													size="sm"
													onClick={() => setDeviceType("light")}
													className="flex-1"
												>
													<Lightbulb className="size-4" />
													Light
												</Button>
												<Button
													variant={deviceType === "ac" ? "default" : "outline"}
													size="sm"
													onClick={() => setDeviceType("ac")}
													className="flex-1"
												>
													<Snowflake className="size-4" />
													AC
												</Button>
											</div>
										</div>

										<div>
											<span className="mb-1 block text-sm text-muted-foreground">
												Acesso
											</span>
											<div className="flex gap-2">
												<Button
													variant={accessType === "actuator" ? "default" : "outline"}
													size="sm"
													onClick={() => setAccessType("actuator")}
													className="flex-1"
												>
													Atuador
												</Button>
												<Button
													variant={accessType === "sensor" ? "default" : "outline"}
													size="sm"
													onClick={() => setAccessType("sensor")}
													className="flex-1"
												>
													Sensor
												</Button>
											</div>
										</div>

										<div>
											<label
												htmlFor="device-place"
												className="mb-1 block text-sm text-muted-foreground"
											>
												Local (ex: sala, escritorio)
											</label>
											<Input
												value={place}
												onChange={(e) => setPlace(e.target.value)}
												placeholder="sala"
												id="device-place"
												onKeyDown={(e) => {
													if (e.key === "Enter" && isValid) handleAdd();
												}}
											/>
										</div>

										<div className="rounded bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
											ID: <span className="text-foreground">{generatedId}</span>
										</div>

										<Button
											disabled={!isValid}
											onClick={handleAdd}
											className="w-full"
										>
											Adicionar
										</Button>
									</div>
								</DialogContent>
							</Dialog>
					</div>
					<div className="flex gap-0.5 rounded bg-muted p-0.5 self-start">
						<Button
							variant={groupBy === "place" ? "default" : "ghost"}
							size="xs"
							onClick={() => setGroupBy("place")}
						>
							Local
						</Button>
						<Button
							variant={groupBy === "type" ? "default" : "ghost"}
							size="xs"
							onClick={() => setGroupBy("type")}
						>
							Tipo
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{devices.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nenhum dispositivo.</p>
					) : (
						<div className="flex flex-col gap-6">
							{[...grouped.entries()].map(([groupKey, groupDevices]) => (
								<div key={groupKey}>
									<h3 className="mb-2 flex items-center gap-1.5 text-xs font-heading font-semibold tracking-wider uppercase text-muted-foreground">
										{groupBy === "type" ? (
											groupKey === "Luz" ? (
												<Lightbulb className="size-3.5" />
											) : (
												<Snowflake className="size-3.5" />
											)
										) : null}
										{groupBy === "type" ? groupKey : toNormalCase(groupKey)}
									</h3>
									{groupBy === "type"
										? ["Sensor", "Atuador"].map((sub) => {
												const subDevices = groupDevices.filter((d) =>
													sub === "Sensor" ? d.isSensor : !d.isSensor,
												);
												if (subDevices.length === 0) return null;
												return (
													<div key={sub} className="mb-4 last:mb-0">
														<h4 className="mb-1.5 pl-1 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/70">
															{sub}
														</h4>
														<ul className="flex flex-col gap-2">
															{subDevices.map(renderDeviceItem)}
														</ul>
													</div>
												);
											})
										: (
											<ul className="flex flex-col gap-2">
												{groupDevices.map(renderDeviceItem)}
											</ul>
										)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
