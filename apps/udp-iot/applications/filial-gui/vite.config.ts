import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
			},
		},
		server: {
			port: parseInt(env.VITE_FILIAL_PORT || "5174", 10),
		},
	};
});
