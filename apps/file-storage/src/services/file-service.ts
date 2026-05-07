import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { count, eq, like, sql, sum } from "drizzle-orm";
import type { PUT_REQ } from "#/@types/command";
import { db } from "#/db";
import { type FileType, files } from "#/db/schema";
import { env } from "#/env";

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
		orderBy: (fields, { desc }) => desc(fields.createdAt),
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
}: {
	fileName: string;
	hash: string;
	content: Buffer<ArrayBuffer>;
}) {
	const hasRecord = await db.query.files.findFirst({
		where: eq(files.fileName, fileName),
	});

	if (hasRecord) {
		throw new Error("Arquivo já existe!");
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
