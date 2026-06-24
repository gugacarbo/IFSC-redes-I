import { useState } from "react";
import type { StoredFile } from "#/types/file";

export function useFileSelection() {
	const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);

	const selectFile = (file: StoredFile) => {
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
