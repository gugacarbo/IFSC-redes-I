import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import type { FileData } from "./create";
import { resolvePath, sanitizeFileName } from "./path";

export async function getFileByName(
	fileName: string,
): Promise<FileData | null> {
	const safeName = sanitizeFileName(fileName);
	const filePath = resolvePath(safeName);

	const exists = await access(filePath)
		.then(() => true)
		.catch(() => false);

	if (!exists) {
		return null;
	}

	const fileBuffer = await readFile(filePath);
	const hash = createHash("sha256").update(fileBuffer).digest("hex");
	const base64Content = fileBuffer.toString("base64");

	return {
		fileName: safeName,
		hash,
		value: base64Content,
	};
}
