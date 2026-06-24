import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import { useState } from "react";
import type { AppConfig } from "../../types";

export function ConfigFooter({
	config,
	apiUrl,
	onAddFilial,
}: {
	config: AppConfig;
	apiUrl: string;
	onAddFilial: () => void;
}) {
	const [saving, setSaving] = useState(false);
	const [msg, setMsg] = useState("");

	const handleSave = async () => {
		setSaving(true);
		setMsg("");
		try {
			const res = await fetch(`${apiUrl}/api/config`, {
				method: "PUT",
				body: JSON.stringify(config),
				headers: { "Content-Type": "application/json" },
			});
			if (res.ok) {
				setMsg("Configuracao salva com sucesso!");
			} else {
				setMsg("Erro ao salvar configuracao.");
			}
		} catch {
			setMsg("Erro de conexao ao salvar.");
		}
		setSaving(false);
	};

	return (
		<div className="flex flex-wrap gap-3 items-center">
			<Button variant="outline" onClick={onAddFilial}>
				+ Adicionar Filial
			</Button>
			<Button onClick={handleSave} disabled={saving} className="ml-auto">
				{saving ? "Salvando..." : "Salvar Configuracoes"}
			</Button>
			{msg && (
				<Badge
					variant={msg.includes("sucesso") ? "outline" : "destructive"}
					className="ml-2"
				>
					{msg}
				</Badge>
			)}
		</div>
	);
}
