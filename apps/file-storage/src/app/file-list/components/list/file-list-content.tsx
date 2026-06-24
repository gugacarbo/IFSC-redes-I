import type { StoredFile } from "#/types/file";
import { EmptyFiles } from "../empty-files";
import { FileListItem } from "./file-list-item";

interface FileListContentProps {
	files: StoredFile[];
	onDelete?: (fileName: string) => void;
}

export function FileListContent({ files, onDelete }: FileListContentProps) {
	if (files.length === 0) {
		return <EmptyFiles />;
	}

	return (
		<div className="space-y-3">
			{files.map((file) => (
				<FileListItem key={file.fileName} file={file} onDelete={onDelete} />
			))}
		</div>
	);
}
