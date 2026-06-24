import { Button } from "@udp-iot/ui/components/button";
import { Input } from "@udp-iot/ui/components/input";
import type { FilialConfig } from "../../types";

export function FilialFormRow({
	filial,
	onUpdate,
	onRemove,
}: {
	filial: FilialConfig;
	onUpdate: (field: keyof FilialConfig, val: string | number) => void;
	onRemove: () => void;
}) {
	return (
		<div className="flex flex-wrap gap-2 items-center bg-muted p-3 rounded">
			<Input
				className="flex-1 min-w-[120px]"
				value={filial.name}
				onChange={(e) => onUpdate("name", e.target.value)}
				placeholder="Nome"
			/>
			<Input
				className="flex-1 min-w-[120px] font-mono"
				value={filial.ip}
				onChange={(e) => onUpdate("ip", e.target.value)}
				placeholder="IP"
			/>
			<Input
				type="number"
				className="w-24 font-mono"
				value={filial.port}
				onChange={(e) =>
					onUpdate("port", parseInt(e.target.value, 10) || 0)
				}
				placeholder="Porta"
			/>
			<Button
				variant="destructive"
				size="sm"
				onClick={onRemove}
			>
				Remover
			</Button>
		</div>
	);
}
