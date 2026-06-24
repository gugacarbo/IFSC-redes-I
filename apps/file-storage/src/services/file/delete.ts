import { access, unlink } from "node:fs/promises";
import { Logger } from "@lib/logging";
import { resolvePath, sanitizeFileName } from "./path";

const logger = Logger.getLogger("DeleteFile");

export async function deleteFileByName(fileName: string): Promise<boolean> {
	const safeName = sanitizeFileName(fileName);
	const filePath = resolvePath(safeName);

	const exists = await access(filePath)
		.then(() => true)
		.catch(() => false);

	if (!exists) {
		return false;
	}

	try {
		await unlink(filePath);
	} catch (error) {
		logger.error("Error deleting file from disk: {}", error);
		return false;
	}

	return true;
}
