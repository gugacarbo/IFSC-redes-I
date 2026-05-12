import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { checkFileConflicts } from "#/server/check-files";
import { createFile } from "#/server/create-file";
import { findExistingFileVariants } from "#/server/get-existing-file-variants";
import { calculateHash, fileToBase64 } from "../lib/file-utils";

interface UploadProgress {
	fileName: string;
	progress: number;
}

type ConflictAction = "overwrite" | "rename";

export function useUploadFile() {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

	// Conflict resolution state
	const [conflictFiles, setConflictFiles] = useState<string[]>([]);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);

	const queryClient = useQueryClient();

	const updateFileProgress = (fileName: string, progress: number) => {
		setUploadProgress((prev) => {
			const existing = prev.find((p) => p.fileName === fileName);
			if (existing) {
				return prev.map((p) =>
					p.fileName === fileName ? { ...p, progress } : p,
				);
			}
			return [...prev, { fileName, progress }];
		});
	};

	/**
	 * Generate a unique file name by appending a counter suffix.
	 * E.g. "file.txt" → "file (1).txt" → "file (2).txt" …
	 */
	function generateUniqueName(
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

	const handleSingleFileUpload = async (
		uploadedFile: File,
		overwrite?: boolean,
	) => {
		if (!uploadedFile) return;

		try {
			updateFileProgress(uploadedFile.name, 30);

			const [hash, base64Value] = await Promise.all([
				calculateHash(uploadedFile),
				fileToBase64(uploadedFile),
			]);

			updateFileProgress(uploadedFile.name, 60);

			const response = await createFile({
				data: {
					cmd: "put_req",
					file: uploadedFile.name,
					hash: hash,
					value: base64Value,
					overwrite,
				},
			});

			updateFileProgress(uploadedFile.name, 100);

			if (!response.success) {
				toast.error(`Erro ao enviar arquivo: ${uploadedFile.name}`);
				console.error("Failed to upload file:", uploadedFile.name);
			}
		} catch (error) {
			toast.error(
				`Erro ao enviar arquivo ${uploadedFile.name}: ` +
					(error instanceof Error ? error?.message : ""),
			);
			console.error("Error uploading file:", uploadedFile.name, error);
		}
	};

	/** Upload files with the chosen conflict resolution strategy */
	const processUpload = async (action: ConflictAction) => {
		const files = pendingFiles;
		setConflictFiles([]);
		setPendingFiles([]);
		setIsUploading(true);
		setUploadProgress([]);

		if (action === "overwrite") {
			// Upload all in parallel with overwrite flag
			await Promise.all(
				files.map((file) => handleSingleFileUpload(file, true)),
			);
		} else {
			// Rename: fetch all existing variants from the server to avoid
			// generating names that already exist (e.g. "file (1).txt")
			const conflictingNames = files
				.filter((f) => conflictFiles.includes(f.name))
				.map((f) => f.name);

			const { existingFiles: serverVariants } =
				conflictingNames.length > 0
					? await findExistingFileVariants({
							data: { fileNames: conflictingNames },
						})
					: { existingFiles: [] as string[] };

			// Seed usedNames with ALL existing variants + names in this batch
			const usedNames = new Set(serverVariants);

			// Process sequentially to avoid race conditions on rename
			for (const file of files) {
				const isConflict = conflictFiles.includes(file.name);
				let targetFile = file;

				if (isConflict) {
					const uniqueName = generateUniqueName(file.name, usedNames);
					usedNames.add(uniqueName);
					// Create a new File object with the unique name
					targetFile = new File([file], uniqueName, { type: file.type });
				}

				await handleSingleFileUpload(targetFile, false);
			}
		}

		queryClient.invalidateQueries({ queryKey: ["files"] });
		queryClient.invalidateQueries({ queryKey: ["fileStats"] });

		setIsUploading(false);
	};

	const handleFilesUpload = async (uploadedFiles: File[]) => {
		if (!uploadedFiles.length) return;

		// Check for name conflicts against the server
		const fileNames = uploadedFiles.map((f) => f.name);
		const { existingFiles } = await checkFileConflicts({
			data: { fileNames },
		});

		if (existingFiles.length > 0) {
			// Store files and conflicts, show dialog
			setConflictFiles(existingFiles);
			setPendingFiles(uploadedFiles);
			return;
		}

		// No conflicts — upload immediately
		setIsUploading(true);
		setUploadProgress([]);

		await Promise.all(
			uploadedFiles.map((file) => handleSingleFileUpload(file)),
		);

		queryClient.invalidateQueries({ queryKey: ["files"] });
		queryClient.invalidateQueries({ queryKey: ["fileStats"] });

		setIsUploading(false);
	};

	const {
		getRootProps,
		getInputProps,
		isDragActive,
		open,
		isFileDialogActive,
	} = useDropzone({
		onDrop: (acceptedFiles: File[]) => {
			handleFilesUpload(acceptedFiles);
		},
		noClick: true,
	});

	const cancelConflictResolution = () => {
		setConflictFiles([]);
		setPendingFiles([]);
	};

	return {
		getRootProps,
		getInputProps,
		isDragActive,
		isUploading,
		uploadProgress,
		open,
		isFileDialogActive,
		// Conflict state
		conflictFiles,
		processUpload,
		cancelConflictResolution,
	};
}
