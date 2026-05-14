import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Input } from "@udp-iot/ui/components/input";
import { Lightbulb, Pencil, Snowflake, Trash2 } from "lucide-react";
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

	const generatedId = `${accessType}_${deviceType}_${place || "..."}`;
	const isValid = place.trim().length > 0;

	function handleAdd() {
		if (!isValid) return;
		onAdd(generatedId);
		setPlace("");
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

	return (
		<div className="flex flex-col gap-6">
			{/* Add Device */}
			<Card size="sm">
				<CardHeader>
					<CardTitle>Adicionar Dispositivo</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div>
						<label className="mb-1 block text-sm text-muted-foreground">
							Tipo
						</label>
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
						<label className="mb-1 block text-sm text-muted-foreground">
							Acesso
						</label>
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
						<label className="mb-1 block text-sm text-muted-foreground">
							Local (ex: sala, escritorio)
						</label>
						<Input
							value={place}
							onChange={(e) => setPlace(e.target.value)}
							placeholder="sala"
						/>
					</div>

					<div className="rounded bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
						ID: <span className="text-foreground">{generatedId}</span>
					</div>

					<Button disabled={!isValid} onClick={handleAdd} className="w-full">
						Adicionar
					</Button>
				</CardContent>
			</Card>

			{/* Device List */}
			<Card size="sm">
				<CardHeader>
					<CardTitle>Dispositivos ({devices.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{devices.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nenhum dispositivo.</p>
					) : (
						<ul className="flex flex-col gap-2">
							{devices.map((device) => (
								<li
									key={device.id}
									className="flex items-center justify-between rounded bg-muted px-3 py-2"
								>
									{renamingId === device.id ? (
										<div className="flex flex-1 items-center gap-2">
											<Input
												value={newName}
												onChange={(e) => setNewName(e.target.value)}
												autoFocus
												onKeyDown={(e) => {
													if (e.key === "Enter") handleRename(device.id);
													if (e.key === "Escape") {
														setRenamingId(null);
														setNewName("");
													}
												}}
											/>
											<Button size="sm" onClick={() => handleRename(device.id)}>
												OK
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setRenamingId(null);
													setNewName("");
												}}
											>
												Cancelar
											</Button>
										</div>
									) : (
										<>
											<div className="flex items-center gap-2">
												{device.isLight ? (
													<Lightbulb className="size-4 text-muted-foreground" />
												) : (
													<Snowflake className="size-4 text-muted-foreground" />
												)}
												<span className="text-sm font-mono">{device.id}</span>
											</div>
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => {
														const parts = device.id.split("_");
														setRenamingId(device.id);
														setNewName(parts.slice(2).join("_"));
													}}
													title="Renomear"
												>
													<Pencil className="size-3.5" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => handleRemove(device.id)}
													title="Remover"
													className="text-destructive hover:text-destructive"
												>
													<Trash2 className="size-3.5" />
												</Button>
											</div>
										</>
									)}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
