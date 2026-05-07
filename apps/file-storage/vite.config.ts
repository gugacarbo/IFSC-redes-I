import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

const config = defineConfig({
	plugins: [
		nitro(),
		devtools(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	nitro: {
		serverDir: "./",
	},
});

export default config;
