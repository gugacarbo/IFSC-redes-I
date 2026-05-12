import { AlertTriangleIcon } from "lucide-react";
import { OffsetPagination } from "#/app/components/offset-pagination";
import { Button } from "#/app/components/ui/button";
import { Card, CardContent } from "#/app/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/app/components/ui/dialog";
import { Spinner } from "#/app/components/ui/spinner";
import { cn } from "#/lib/utils";
import { Route } from "#/routes";
import { DragHere } from "./components/drag-here";
import { FileListContent } from "./components/file-list-content";
import { FileListHeader } from "./components/file-list-header";
import { FileListSkeleton } from "./components/file-list-skeleton";
import { SearchFile } from "./components/search-file";
import { UploadProgress } from "./components/upload-progress";
import { useDeleteFile } from "./hooks/use-delete-file";
import { useFileList } from "./hooks/use-file-list";
import { useUploadFile } from "./hooks/use-upload-file";

const ITEMS_PER_PAGE = 10;

function FileList() {
	const { limit = ITEMS_PER_PAGE, offset = 0, search } = Route.useSearch();

	const navigate = Route.useNavigate();

	const handleSetSearchQuery = (query: string) => {
		navigate({
			search: (prev) => ({
				...prev,
				search: query || undefined,
				offset: 0,
			}),
		});
	};

	const handlePageChange = (page: number) => {
		navigate({
			search: (prev) => ({
				...prev,
				offset: (page - 1) * limit,
			}),
		});
	};

	const handleInvalidOffset = (lastValidOffset: number) => {
		navigate({
			search: (prev) => ({
				...prev,
				offset: lastValidOffset,
			}),
		});
	};

	const { files, totalItems, totalPages, currentPage, showSkeleton, isStale } =
		useFileList({
			offset,
			limit,
			search,
			onInvalidOffset: handleInvalidOffset,
		});

	const {
		isUploading,
		uploadProgress,
		getRootProps,
		getInputProps,
		isDragActive,
		open,
		isFileDialogActive,
		conflictFiles,
		processUpload,
		cancelConflictResolution,
	} = useUploadFile();

	const {
		requestDelete,
		confirmDelete,
		cancelDelete,
		isDeleting,
		confirmFileId,
		confirmFileName,
	} = useDeleteFile();

	return (
		<>
			<SearchFile value={search} onChange={handleSetSearchQuery} />
			<Card {...getRootProps()} className="relative">
				<DragHere isDragActive={isDragActive} />
				<FileListHeader
					totalItems={totalItems}
					onAddFile={open}
					disabled={isFileDialogActive}
				/>
				<CardContent
					className={cn(
						"transition-opacity",
						isStale && "opacity-50 pointer-events-none",
					)}
				>
					{showSkeleton && <FileListSkeleton />}
					{isUploading && <UploadProgress progress={uploadProgress} />}
					<FileListContent files={files} onDelete={requestDelete} />
					<OffsetPagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
					/>
				</CardContent>
				<input {...getInputProps()} />
			</Card>

			<Dialog
				open={confirmFileId !== null}
				onOpenChange={(open) => {
					if (!open) cancelDelete();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Excluir arquivo</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir o arquivo{" "}
							<strong>{confirmFileName}</strong>? Esta ação não pode ser
							desfeita.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={cancelDelete}
							disabled={isDeleting}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDelete}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Spinner className="h-4 w-4 mr-1" />
									Excluindo...
								</>
							) : (
								"Excluir"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Conflict resolution dialog */}
			<Dialog
				open={conflictFiles.length > 0}
				onOpenChange={(open) => {
					if (!open) cancelConflictResolution();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<div className="flex items-center gap-2">
							<AlertTriangleIcon className="h-5 w-5 text-amber-500" />
							<DialogTitle>Conflitos de nomes</DialogTitle>
						</div>
						<DialogDescription>
							Os seguintes arquivos já existem no servidor. O que deseja fazer?
						</DialogDescription>
					</DialogHeader>
					<ul className="list-disc list-inside text-sm space-y-1">
						{conflictFiles.map((name) => (
							<li key={name}>{name}</li>
						))}
					</ul>
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={cancelConflictResolution}>
							Cancelar
						</Button>
						<Button variant="secondary" onClick={() => processUpload("rename")}>
							Renomear novos
						</Button>
						<Button
							variant="default"
							onClick={() => processUpload("overwrite")}
						>
							Substituir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export { FileList };
