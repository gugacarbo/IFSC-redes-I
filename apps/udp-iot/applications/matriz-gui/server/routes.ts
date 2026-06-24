import { type AppConfig, currentConfig, setCurrentConfig, saveConfig } from "./config.js";
import { startPolling } from "./polling.js";

export function setupRoutes(app: import("express").Application): void {
	app.get("/health", (_req, res) => res.json({ ok: true }));
	app.get("/api/config", (_req, res) => res.json(currentConfig));
	app.put("/api/config", (req, res) => {
		const newConfig: AppConfig = req.body;
		saveConfig(newConfig);
		setCurrentConfig(newConfig);
		startPolling();
		res.json({ ok: true });
	});
}
