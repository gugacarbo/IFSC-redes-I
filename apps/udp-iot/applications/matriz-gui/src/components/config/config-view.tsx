import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { useEffect, useState } from "react";
import type { AppConfig } from "../../types";
import { ConfigFields } from "./config-fields";
import { FilialFormRow } from "./filial-form-row";
import { ConfigFooter } from "./config-footer";

const API_URL = import.meta.env.VITE_MATRIZ_API_URL || "http://localhost:3001";

export function ConfigView() {
	const [config, setConfig] = useState<AppConfig | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${API_URL}/api/config`)
			.then((res) => res.json())
			.then((data) => {
				setConfig(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	const updateFilial = (
		idx: number,
		field: keyof import("../../types").FilialConfig,
		val: string | number,
	) => {
		if (!config) return;
		const n = [...config.filiais];
		n[idx] = { ...n[idx], [field]: val };
		setConfig({ ...config, filiais: n });
	};

	const removeFilial = (idx: number) => {
		if (!config) return;
		setConfig({
			...config,
			filiais: config.filiais.filter((_, i) => i !== idx),
		});
	};

	const addFilial = () => {
		if (!config) return;
		setConfig({
			...config,
			filiais: [
				...config.filiais,
				{ name: "Nova Filial", ip: "", port: 51000 },
			],
		});
	};

	if (loading)
		return <div className="p-6 text-muted-foreground">Carregando...</div>;
	if (!config)
		return (
			<div className="p-6 text-destructive">
				Falha ao carregar configuracoes.
			</div>
		);

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle>Configuracoes da Matriz</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<ConfigFields config={config} onChange={setConfig} />

				<div>
					<h3 className="font-heading font-semibold mb-3 tracking-wider uppercase text-sm">
						Filiais Cadastradas
					</h3>
					<div className="flex flex-col gap-3 mb-6">
						{config.filiais.map((f) => (
							<FilialFormRow
								key={f.ip + f.port}
								filial={f}
								onUpdate={(field, val) =>
									updateFilial(config.filiais.indexOf(f), field, val)
								}
								onRemove={() => removeFilial(config.filiais.indexOf(f))}
							/>
						))}
					</div>
				</div>

				<ConfigFooter
					config={config}
					apiUrl={API_URL}
					onAddFilial={addFilial}
				/>
			</CardContent>
		</Card>
	);
}
