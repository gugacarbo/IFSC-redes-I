import { readdir } from "node:fs/promises";
import { ensureStorageDir, getStorageDir } from "./path";

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildVariantPattern(fileName: string): RegExp {
	const dotIndex = fileName.lastIndexOf(".");
	const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
	const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";

	return new RegExp(
		`^${escapeRegExp(baseName)}( \\(\\d+\\))?${escapeRegExp(extension)}$`,
	);
}

async function getStorageFileNames(): Promise<Set<string>> {
	await ensureStorageDir();

	const entries = await readdir(getStorageDir(), { withFileTypes: true });

	return new Set(
		entries
			.filter((entry) => entry.isFile() && !entry.name.startsWith("."))
			.map((entry) => entry.name),
	);
}

export async function getExistingFileNames(
	fileNames: string[],
): Promise<string[]> {
	const storedNames = await getStorageFileNames();
	return fileNames.filter((name) => storedNames.has(name));
}

export async function getExistingFileVariants(
	fileNames: string[],
): Promise<string[]> {
	if (fileNames.length === 0) return [];

	const storedNames = await getStorageFileNames();
	const patterns = fileNames.map((name) => buildVariantPattern(name));
	const matches = new Set<string>();

	for (const storedName of storedNames) {
		if (patterns.some((pattern) => pattern.test(storedName))) {
			matches.add(storedName);
		}
	}

	return [...matches];
}
