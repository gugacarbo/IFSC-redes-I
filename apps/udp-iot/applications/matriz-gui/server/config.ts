import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Logger } from "@lib/logging";

const logger = Logger.getLogger("MatrizServer");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONFIG_PATH = path.resolve(__dirname, "../config/matriz.json");

export interface FilialConfig {
	name: string;
	ip: string;
	port: number;
}

export interface AppConfig {
	user: string;
	pass: string;
	pollingMs: number;
	filiais: FilialConfig[];
}

export let currentConfig: AppConfig;

export function setCurrentConfig(cfg: AppConfig): void {
	currentConfig = cfg;
}

export function loadConfig(): AppConfig {
	try {
		const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
		return JSON.parse(raw);
	} catch {
		const def: AppConfig = {
			user: "admin",
			pass: "admin",
			pollingMs: 5000,
			filiais: [{ name: "Filial Local", ip: "127.0.0.1", port: 51000 }],
		};
		saveConfig(def);
		return def;
	}
}

export function saveConfig(cfg: AppConfig) {
	const dir = path.dirname(CONFIG_PATH);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}
