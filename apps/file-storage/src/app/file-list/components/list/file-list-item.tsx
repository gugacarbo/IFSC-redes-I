import { DownloadIcon, Trash2Icon } from "lucide-react";
import { Button } from "#/app/components/ui/button";
import { Spinner } from "#/app/components/ui/spinner";
import { useDownloadFile } from "#/app/file-list/hooks/use-download-file";
import { formatDate, formatFileSize } from "#/lib/format";
import { getFileIcon, getFileType } from "#/lib/file-type";
import type { StoredFile } from "#/types/file";

interface FileListItemProps {
	file: StoredFile;
	onDelete?: (fileName: string) => void;
}

export function FileListItem({ file, onDelete }: FileListItemProps) {
	const { downloadFile, isDownloading } = useDownloadFile();

	const handleDownload = () => {
		downloadFile(file.fileName);
	};

	return (
		<div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
			<div className="flex items-center gap-3">
				<div className="p-2 bg-muted rounded-md">
					{getFileIcon(getFileType(file.fileName))}
				</div>
				<div>
					<p className="font-medium">{file.fileName}</p>
					<p className="text-sm text-muted-foreground">
						{formatFileSize(file.size)} • {formatDate(file.createdAt)}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleDownload}
					disabled={isDownloading}
				>
					{isDownloading ? (
						<>
							<Spinner className="h-4 w-4 mr-1" />
							Baixando...
						</>
					) : (
						<>
							<DownloadIcon className="h-4 w-4 mr-1" />
							Download
						</>
					)}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="text-destructive"
					onClick={() => onDelete?.(file.fileName)}
				>
					<Trash2Icon className="h-4 w-4 mr-1" />
					Excluir
				</Button>
			</div>
		</div>
	);
}
