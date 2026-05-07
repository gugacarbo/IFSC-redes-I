import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { createFile } from "#/server/create-file";
import { calculateHash, fileToBase64 } from "../lib/file-utils";

interface UploadProgress {
	fileName: string;
	progress: number;
}

export function useUploadFile() {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

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

	const handleSingleFileUpload = async (uploadedFile: File) => {
		if (!uploadedFile) return;

		try {
			updateFileProgress(uploadedFile.name, 30);

			// Calculate hash and convert to base64 in parallel
			const [hash, base64Value] = await Promise.all([
				calculateHash(uploadedFile),
				fileToBase64(uploadedFile),
			]);

			updateFileProgress(uploadedFile.name, 60);

			// Call the server function to save the file
			const response = await createFile({
				data: {
					cmd: "put_req",
					file: uploadedFile.name,
					hash: hash,
					value: base64Value,
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

	const handleFilesUpload = async (uploadedFiles: File[]) => {
		if (!uploadedFiles.length) return;

		setIsUploading(true);
		setUploadProgress([]);

		// Upload all files in parallel
		await Promise.all(
			uploadedFiles.map((file) => handleSingleFileUpload(file)),
		);

		// Refresh the file list
		queryClient.invalidateQueries({ queryKey: ["files"] });
		queryClient.invalidateQueries({ queryKey: ["fileStats"] });

		setIsUploading(false);
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (acceptedFiles: File[]) => {
			handleFilesUpload(acceptedFiles);
		},
		noClick: true,
	});

	return {
		getRootProps,
		getInputProps,
		isDragActive,
		isUploading,
		uploadProgress,
	};
}
