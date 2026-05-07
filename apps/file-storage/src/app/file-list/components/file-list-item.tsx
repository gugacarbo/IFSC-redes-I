import { DownloadIcon, Trash2Icon } from "lucide-react";
import { Button } from "#/app/components/ui/button";
import { Spinner } from "#/app/components/ui/spinner";
import { useDownloadFile } from "#/app/file-list/hooks/use-download-file";
import type { FileType } from "#/db/schema";
import {
	formatDate,
	formatFileSize,
	getFileIcon,
	getFileType,
} from "#/lib/utils";

interface FileListItemProps {
	file: FileType;
	onDelete?: (id: number) => void;
}

export function FileListItem({ file, onDelete }: FileListItemProps) {
	const { downloadFile, isDownloading } = useDownloadFile();

	const handleDownload = () => {
		downloadFile(file.id);
	};

	return (
		<div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
			<div className="flex items-center gap-3">
				<div className="p-2 bg-muted rounded-md">
					{getFileIcon(getFileType(file.path))}
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
				<Button variant="ghost" size="sm" onClick={() => onDelete?.(file.id)}>
					<Trash2Icon className="h-4 w-4 mr-1" />
					Excluir
				</Button>
			</div>
		</div>
	);
}
