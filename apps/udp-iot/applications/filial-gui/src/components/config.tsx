import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Input } from "@udp-iot/ui/components/input";
import { useEffect, useState } from "react";
import type { ServerConfig } from "../types";

interface ConfigProps {
	config: ServerConfig | null;
	onSave: (config: ServerConfig) => void;
}

export function Config({ config, onSave }: ConfigProps) {
	const [port, setPort] = useState("51000");
	const [adminUser, setAdminUser] = useState("admin");
	const [adminPass, setAdminPass] = useState("admin");
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (config) {
			setPort(String(config.port));
			setAdminUser(config.adminUser);
			setAdminPass(config.adminPass);
		}
	}, [config]);

	function handleSave() {
		onSave({ port: parseInt(port, 10) || 51000, adminUser, adminPass });
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}

	return (
		<div className="mx-auto max-w-md">
			<Card size="sm">
				<CardHeader>
					<CardTitle>Configuracao do Servidor</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div>
						<label className="mb-1 block text-sm text-muted-foreground">
							Porta UDP
						</label>
						<Input
							type="number"
							value={port}
							onChange={(e) => setPort(e.target.value)}
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm text-muted-foreground">
							Usuario Admin
						</label>
						<Input
							type="text"
							value={adminUser}
							onChange={(e) => setAdminUser(e.target.value)}
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm text-muted-foreground">
							Senha Admin
						</label>
						<Input
							type="password"
							value={adminPass}
							onChange={(e) => setAdminPass(e.target.value)}
						/>
					</div>
					<Button
						onClick={handleSave}
						className="w-full"
						variant={saved ? "secondary" : "default"}
					>
						{saved ? "Salvo!" : "Salvar"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
