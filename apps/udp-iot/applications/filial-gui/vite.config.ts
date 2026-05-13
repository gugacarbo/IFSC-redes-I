import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
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
  }
})
