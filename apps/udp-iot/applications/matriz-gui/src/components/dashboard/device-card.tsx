import { Button } from "@udp-iot/ui/components/button";
import { Input } from "@udp-iot/ui/components/input";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import type { AppConfig } from "../../types";
import {
	resolveConfigAlias,
	resolveDeviceName,
} from "../../lib/deviceNaming";
import { DeviceControl } from "./device-control";

export interface DeviceCardProps {
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
}

export function DeviceCard(props: DeviceCardProps) {
	const { dev, ip, state, config, getAlias, editingKey, draftAlias, onCommand, onBeginEdit, onSaveEdit, onCancelEdit, onClearAlias, setDraftAlias } = props;
	const val = state[dev];
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

			<DeviceControl dev={dev} val={val} onCommand={onCommand} ip={ip} />
		</div>
	);
}
