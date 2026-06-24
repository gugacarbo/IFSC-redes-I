import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Lightbulb, Snowflake } from "lucide-react";
import { useState } from "react";
import type { DeviceInfo } from "../types";
import { extractPlace, toNormalCase } from "../lib/device-utils";
import { AddDeviceDialog } from "./device-editor/add-device-dialog";
import { DeviceItem } from "./device-editor/device-item";
import { GroupToggle } from "./device-editor/group-toggle";

interface DeviceEditorProps {
	devices: DeviceInfo[];
	onAdd: (id: string) => void;
	onRemove: (id: string) => void;
	onRename: (oldId: string, newId: string) => void;
}

export function DeviceEditor({
	devices,
	onAdd,
	onRemove,
	onRename,
}: DeviceEditorProps) {
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [newName, setNewName] = useState("");
	const [groupBy, setGroupBy] = useState<"place" | "type">("place");

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
			<Card size="sm">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Dispositivos ({devices.length})</CardTitle>
						<AddDeviceDialog onAdd={onAdd} />
					</div>
					<GroupToggle groupBy={groupBy} onChange={setGroupBy} />
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
