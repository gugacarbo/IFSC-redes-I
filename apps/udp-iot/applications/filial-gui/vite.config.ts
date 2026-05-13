import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
	plugins: [react(), tailwindcss()],
    server: {
      port: parseInt(env.VITE_FILIAL_PORT || "5174", 10),
    },
  }
})
