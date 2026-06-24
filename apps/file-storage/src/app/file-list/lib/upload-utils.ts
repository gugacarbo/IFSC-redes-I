import { toast } from "sonner";
import { createFile } from "#/server/create-file";
import { calculateHash, fileToBase64 } from "./file-utils";

export interface UploadProgress {
	fileName: string;
	progress: number;
}

export type ConflictAction = "overwrite" | "rename";

export function generateUniqueName(
	originalName: string,
	usedNames: Set<string>,
): string {
	const dotIndex = originalName.lastIndexOf(".");
	const baseName =
		dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
	const extension = dotIndex > 0 ? originalName.slice(dotIndex) : "";

	let counter = 1;
	let candidate = `${baseName} (${counter})${extension}`;
	while (usedNames.has(candidate)) {
		counter++;
		candidate = `${baseName} (${counter})${extension}`;
	}
	return candidate;
}

export async function uploadSingleFile(
	uploadedFile: File,
	onProgress: (fileName: string, progress: number) => void,
	overwrite?: boolean,
): Promise<void> {
	if (!uploadedFile) return;

	try {
		onProgress(uploadedFile.name, 30);

		const [hash, base64Value] = await Promise.all([
			calculateHash(uploadedFile),
			fileToBase64(uploadedFile),
		]);

		onProgress(uploadedFile.name, 60);

		const response = await createFile({
			data: {
				cmd: "put_req",
				file: uploadedFile.name,
				hash: hash,
				value: base64Value,
				overwrite,
			},
		});

		onProgress(uploadedFile.name, 100);

		if (!response.success) {
			toast.error(`Erro ao enviar arquivo: ${uploadedFile.name}`);
		}
	} catch (error) {
		toast.error(
			`Erro ao enviar arquivo ${uploadedFile.name}: ` +
				(error instanceof Error ? error?.message : ""),
		);
	}
}
