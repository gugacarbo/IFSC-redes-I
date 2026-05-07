import { useState } from "react";
import type { FileType } from "#/db/schema";

export function useFileSelection() {
	const [selectedFile, setSelectedFile] = useState<FileType | null>(null);

	const selectFile = (file: FileType) => {
		setSelectedFile(file);
	};

	const clearSelection = () => {
		setSelectedFile(null);
	};

	return {
		selectedFile,
		selectFile,
		clearSelection,
	};
}
