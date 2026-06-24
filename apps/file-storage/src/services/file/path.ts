import { mkdir } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "#/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..", "..", "..");

export function getStorageDir() {
	return join(appRoot, env.STORAGE_PATH);
}

export function sanitizeFileName(fileName: string): string {
	const name = basename(fileName.trim());

	if (!name || name === "." || name === "..") {
		throw new Error("Nome de arquivo inválido");
	}

	if (name.includes("/") || name.includes("\\") || name.includes("..")) {
		throw new Error("Nome de arquivo inválido");
	}

	return name;
}

export function resolvePath(fileName: string) {
	const safeName = sanitizeFileName(fileName);
	const storageDir = getStorageDir();
	const filePath = resolve(storageDir, safeName);

	if (!filePath.startsWith(resolve(storageDir))) {
		throw new Error("Nome de arquivo inválido");
	}

	return filePath;
}

export async function ensureStorageDir() {
	await mkdir(getStorageDir(), { recursive: true });
}
