import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type z from "zod";

export const files = sqliteTable("files", {
	id: integer({ mode: "number" }).primaryKey({
		autoIncrement: true,
	}),
	fileName: text("file_name").notNull().unique(),
	hash: text("hash").notNull(),
	size: integer("size").notNull(),
	path: text("path").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const fileSchema = createSelectSchema(files);
export const insertFileSchema = createInsertSchema(files);

export type FileType = z.infer<typeof fileSchema>;
export type InsertFileType = z.infer<typeof insertFileSchema>;
