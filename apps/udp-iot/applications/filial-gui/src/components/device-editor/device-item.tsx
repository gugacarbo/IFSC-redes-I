import { Button } from "@udp-iot/ui/components/button";
import { Input } from "@udp-iot/ui/components/input";
import { Pencil, Trash2 } from "lucide-react";
import type { DeviceInfo } from "../../types";
import { toNormalCase } from "../../lib/device-utils";
import { DeviceIcon } from "./device-icon";

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

export function DeviceItem({
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
