import { createHash } from "node:crypto";
import { access, stat, writeFile } from "node:fs/promises";
import type { PUT_REQ } from "#/@types/command";
import type { StoredFile } from "#/types/file";
import { ensureStorageDir, resolvePath, sanitizeFileName } from "./path";

export interface FileData {
	fileName: string;
	hash: string;
	value: string;
}

export async function validateFileInput({
	file,
	hash,
	value,
}: Omit<PUT_REQ, "cmd">) {
	const fileBuffer = Buffer.from(value, "base64");

	const calculatedHash = createHash("sha256").update(fileBuffer).digest("hex");

	if (calculatedHash !== hash) {
		throw new Error("Invalid Hash");
	}

	return {
		fileName: file,
		hash: calculatedHash,
		content: fileBuffer,
	};
}

export async function putFile({
	fileName,
	hash,
	content,
	overwrite,
}: {
	fileName: string;
	hash: string;
	content: Buffer<ArrayBuffer>;
	overwrite?: boolean;
}): Promise<StoredFile> {
	const safeName = sanitizeFileName(fileName);
	const filePath = resolvePath(safeName);

	await ensureStorageDir();

	const exists = await access(filePath)
		.then(() => true)
		.catch(() => false);

	if (exists && !overwrite) {
		throw new Error("Arquivo já existe!");
	}

	await writeFile(filePath, content);

	const fileStat = await stat(filePath);

	return {
		fileName: safeName,
		size: content.length,
		createdAt: fileStat.birthtime ?? fileStat.mtime,
		hash,
	};
}
