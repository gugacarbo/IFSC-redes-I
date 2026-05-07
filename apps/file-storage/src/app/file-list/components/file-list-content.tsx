import type { FileType } from "#/db/schema";
import { EmptyFiles } from "./empty-files";
import { FileListItem } from "./file-list-item";

interface FileListContentProps {
	files: FileType[];
	onDelete?: (id: number) => void;
}

export function FileListContent({ files, onDelete }: FileListContentProps) {
	if (files.length === 0) {
		return <EmptyFiles />;
	}

	return (
		<div className="space-y-3">
			{files.map((file) => (
				<FileListItem key={file.id} file={file} onDelete={onDelete} />
			))}
		</div>
	);
}
