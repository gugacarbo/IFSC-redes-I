#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const builtPath = resolve(dir, "dist/src/index.js");

if (existsSync(builtPath)) {
	execSync("node dist/src/index.js", { cwd: dir, stdio: "inherit" });
} else {
	console.log("Build não encontrado. Compilando o launcher...");
	execSync("npm run build", { cwd: dir, stdio: "inherit" });
	execSync("node dist/src/index.js", { cwd: dir, stdio: "inherit" });
}
