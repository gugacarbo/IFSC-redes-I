import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { checkFileConflicts } from "#/server/check-files";
import { findExistingFileVariants } from "#/server/get-existing-file-variants";
import type { ConflictAction, UploadProgress } from "../lib/upload-utils";
import { generateUniqueName, uploadSingleFile } from "../lib/upload-utils";

export function useUploadFile() {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
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

	const processUpload = async (action: ConflictAction) => {
		const files = pendingFiles;
		setConflictFiles([]);
		setPendingFiles([]);
		setIsUploading(true);
		setUploadProgress([]);

		if (action === "overwrite") {
			await Promise.all(
				files.map((file) => uploadSingleFile(file, updateFileProgress, true)),
			);
		} else {
			const conflictingNames = files
				.filter((f) => conflictFiles.includes(f.name))
				.map((f) => f.name);

			const { existingFiles: serverVariants } =
				conflictingNames.length > 0
					? await findExistingFileVariants({
							data: { fileNames: conflictingNames },
						})
					: { existingFiles: [] as string[] };

			const usedNames = new Set(serverVariants);

			for (const file of files) {
				const isConflict = conflictFiles.includes(file.name);
				let targetFile = file;

				if (isConflict) {
					const uniqueName = generateUniqueName(file.name, usedNames);
					usedNames.add(uniqueName);
					targetFile = new File([file], uniqueName, { type: file.type });
				}

				await uploadSingleFile(targetFile, updateFileProgress, false);
			}
		}

		queryClient.invalidateQueries({ queryKey: ["files"] });
		queryClient.invalidateQueries({ queryKey: ["fileStats"] });

		setIsUploading(false);
	};

	const handleFilesUpload = async (uploadedFiles: File[]) => {
		if (!uploadedFiles.length) return;

		const fileNames = uploadedFiles.map((f) => f.name);
		const { existingFiles } = await checkFileConflicts({
			data: { fileNames },
		});

		if (existingFiles.length > 0) {
			setConflictFiles(existingFiles);
			setPendingFiles(uploadedFiles);
			return;
		}

		setIsUploading(true);
		setUploadProgress([]);

		await Promise.all(
			uploadedFiles.map((file) => uploadSingleFile(file, updateFileProgress)),
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
		conflictFiles,
		processUpload,
		cancelConflictResolution,
	};
}
