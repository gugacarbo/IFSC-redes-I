import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Input } from "@udp-iot/ui/components/input";
import { useEffect, useState } from "react";
import type { AppConfig, FilialConfig } from "../types";

const API_URL = import.meta.env.VITE_MATRIZ_API_URL || "http://localhost:3001";

export function ConfigView() {
	const [config, setConfig] = useState<AppConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [msg, setMsg] = useState("");

	useEffect(() => {
		fetch(`${API_URL}/api/config`)
			.then((res) => res.json())
			.then((data) => {
				setConfig(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	const handleSave = async () => {
		if (!config) return;
		setSaving(true);
		setMsg("");
		try {
			const res = await fetch(`${API_URL}/api/config`, {
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

	const updateFilial = (
		idx: number,
		field: keyof FilialConfig,
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
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label
							htmlFor="config-user"
							className="block text-sm font-semibold mb-1"
						>
							Usuario
						</label>
						<Input
							type="text"
							value={config.user}
							onChange={(e) => setConfig({ ...config, user: e.target.value })}
							id="config-user"
						/>
					</div>
					<div>
						<label
							htmlFor="config-pass"
							className="block text-sm font-semibold mb-1"
						>
							Senha
						</label>
						<Input
							type="password"
							value={config.pass}
							onChange={(e) => setConfig({ ...config, pass: e.target.value })}
							id="config-pass"
						/>
					</div>
					<div>
						<label
							htmlFor="config-polling"
							className="block text-sm font-semibold mb-1"
						>
							Polling (ms)
						</label>
						<Input
							type="number"
							value={config.pollingMs}
							onChange={(e) =>
								setConfig({
									...config,
									pollingMs: parseInt(e.target.value, 10) || 0,
								})
							}
							id="config-polling"
						/>
					</div>
				</div>

				<div>
					<h3 className="font-heading font-semibold mb-3 tracking-wider uppercase text-sm">
						Filiais Cadastradas
					</h3>
					<div className="flex flex-col gap-3 mb-6">
						{config.filiais.map((f) => (
							<div
								key={f.ip + f.port}
								className="flex flex-wrap gap-2 items-center bg-muted p-3 rounded"
							>
								<Input
									className="flex-1 min-w-[120px]"
									value={f.name}
									onChange={(e) =>
										updateFilial(
											config.filiais.indexOf(f),
											"name",
											e.target.value,
										)
									}
									placeholder="Nome"
								/>
								<Input
									className="flex-1 min-w-[120px] font-mono"
									value={f.ip}
									onChange={(e) =>
										updateFilial(
											config.filiais.indexOf(f),
											"ip",
											e.target.value,
										)
									}
									placeholder="IP"
								/>
								<Input
									type="number"
									className="w-24 font-mono"
									value={f.port}
									onChange={(e) =>
										updateFilial(
											config.filiais.indexOf(f),
											"port",
											parseInt(e.target.value, 10) || 0,
										)
									}
									placeholder="Porta"
								/>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => removeFilial(config.filiais.indexOf(f))}
								>
									Remover
								</Button>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-wrap gap-3 items-center">
					<Button variant="outline" onClick={addFilial}>
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
			</CardContent>
		</Card>
	);
}
