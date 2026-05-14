import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Logger } from "@lib/logging";
import { count, eq, inArray, like, or, sql, sum } from "drizzle-orm";
import type { PUT_REQ } from "#/@types/command";
import { db } from "#/db";
import { type FileType, files } from "#/db/schema";
import { env } from "#/env";

const logger = Logger.getLogger("FileService");

export interface FileData {
	fileName: string;
	hash: string;
	value: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..", "..");

export function resolvePath(path: string) {
	const rootPath = join(appRoot, env.STORAGE_PATH);
	return join(rootPath, path);
}

function buildSearchClause(search?: string) {
	return search
		? like(sql`lower(${files.fileName})`, `%${search.toLowerCase()}%`)
		: undefined;
}

export async function listFiles({
	offset,
	limit,
	search,
	columns,
}: {
	offset?: number;
	limit?: number;
	search?: string;
	columns?: Partial<Record<keyof FileType, boolean>>;
}) {
	const filesList = await db.query.files.findMany({
		orderBy: (fields, { desc }) => [desc(fields.createdAt), desc(fields.id)],
		where: buildSearchClause(search),
		offset,
		limit,
		columns,
	});

	return filesList;
}

export async function getTotalSize() {
	const [result] = await db.select({ total: sum(files.size) }).from(files);
	return Number(result?.total ?? "0") ?? 0;
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
}) {
	const existingRecord = await db.query.files.findFirst({
		where: eq(files.fileName, fileName),
	});

	if (existingRecord) {
		if (!overwrite) {
			throw new Error("Arquivo já existe!");
		}

		// Remove old file from disk (ignore error if file doesn't exist)
		try {
			await unlink(existingRecord.path);
		} catch {
			// file may already be missing
		}

		// Delete old database record
		await db.delete(files).where(eq(files.id, existingRecord.id));
	}

	const randomId = randomBytes(4).toString("hex");
	const extension = extname(fileName);
	const nameWithoutExt = fileName.slice(0, fileName.length - extension.length);
	const newFilePath = `${nameWithoutExt}_${randomId}${extension}`;

	const filePath = resolvePath(newFilePath);

	await mkdir(dirname(filePath), { recursive: true });
	await writeFile(filePath, content);

	return await db
		.insert(files)
		.values({
			size: content.length,
			fileName: fileName,
			path: filePath,
			hash: hash,
		})
		.returning();
}

export async function deleteFileById(id: number): Promise<boolean> {
	const fileRecord = await db.query.files.findFirst({
		where: eq(files.id, id),
	});

	if (!fileRecord) {
		return false;
	}

	try {
		await unlink(fileRecord.path);
	} catch (error) {
		logger.error("Error deleting file from disk: {}", error);
	}

	await db.delete(files).where(eq(files.id, id));

	return true;
}

export async function getExistingFileNames(
	fileNames: string[],
): Promise<string[]> {
	const result = await db
		.select({ fileName: files.fileName })
		.from(files)
		.where(inArray(files.fileName, fileNames));

	return result.map((r) => r.fileName);
}

/**
 * For each filename, find all existing variants on the server:
 * - Exact match (e.g. "file.txt")
 * - Renamed variants (e.g. "file (1).txt", "file (2).txt", …)
 */
export async function getExistingFileVariants(
	fileNames: string[],
): Promise<string[]> {
	if (fileNames.length === 0) return [];

	const conditions = fileNames.map((name) => {
		const dotIndex = name.lastIndexOf(".");
		const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
		const extension = dotIndex > 0 ? name.slice(dotIndex) : "";

		return or(
			eq(files.fileName, name),
			like(files.fileName, `${baseName} (%)${extension}`),
		);
	});

	const result = await db
		.select({ fileName: files.fileName })
		.from(files)
		.where(or(...conditions));

	return result.map((r) => r.fileName);
}

export async function countFiles(search = "") {
	const query = db.select({ count: count() }).from(files);

	const searchClause = buildSearchClause(search);
	if (searchClause) {
		query.where(searchClause);
	}

	const [result] = await query;
	return result?.count ?? 0;
}

export interface FileStats {
	count: number;
	totalSize: number;
	uploadsToday: number;
}

export async function filesStats(): Promise<FileStats> {
	const startOfTodayUnix = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

	const [result] = await db
		.select({
			count: count(),
			total: sum(files.size),
			uploadsToday: sql<number>`sum(case when ${files.createdAt} >= ${startOfTodayUnix} then 1 else 0 end)`,
		})
		.from(files);

	return {
		count: result?.count ?? 0,
		totalSize: Number(result?.total ?? "0") ?? 0,
		uploadsToday: result?.uploadsToday ?? 0,
	};
}

export async function getFileById(id: number): Promise<FileData | null> {
	const fileRecord = await db.query.files.findFirst({
		where: eq(files.id, id),
	});

	if (!fileRecord) {
		return null;
	}

	const fileBuffer = await readFile(fileRecord.path);
	const base64Content = fileBuffer.toString("base64");

	return {
		fileName: fileRecord.fileName,
		hash: fileRecord.hash,
		value: base64Content,
	};
}

export async function getFileByName(
	fileName: string,
): Promise<FileData | null> {
	const fileRecord = await db.query.files.findFirst({
		where: eq(files.fileName, fileName),
	});

	if (!fileRecord) {
		return null;
	}

	const fileBuffer = await readFile(fileRecord.path);
	const base64Content = fileBuffer.toString("base64");

	return {
		fileName: fileRecord.fileName,
		hash: fileRecord.hash,
		value: base64Content,
	};
}
