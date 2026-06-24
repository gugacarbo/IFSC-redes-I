import { useMemo, useState } from "react";
import { useDeviceAliases } from "../../hooks/useDeviceAliases";
import { extractPlace } from "../../lib/device-utils";
import type { AppConfig, FilialData } from "../../types";
import { FilialCard } from "./filial-card";

type GroupMode = "location" | "type";

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
			{entries.map((filial) => (
				<FilialCard
					key={filial.ip}
					filial={filial}
					config={config}
					effectiveGroup={effectiveGroup}
					sharedDeviceProps={sharedDeviceProps}
					onGroupMode={setGroupMode}
				/>
			))}
		</div>
	);
}
