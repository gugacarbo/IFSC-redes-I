import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
			},
		},
		build: {
			outDir: "../matriz-esp32/data/www",
			emptyOutDir: true,
		},
		server: {
			port: parseInt(env.VITE_MATRIZ_PORT || "5173", 10),
		},
	};
});
