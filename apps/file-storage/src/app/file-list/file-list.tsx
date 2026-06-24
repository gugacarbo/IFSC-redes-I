import { OffsetPagination } from "#/app/components/offset-pagination";
import { Card, CardContent } from "#/app/components/ui/card";
import { cn } from "#/lib/cn";
import { Route } from "#/routes";
import {
	ConflictDialog,
	DeleteConfirmDialog,
	DragHere,
	FileListContent,
	FileListHeader,
	FileListSkeleton,
	SearchFile,
	UploadProgress,
} from "./components";
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

	const {
		files,
		totalItems,
		totalPages,
		currentPage,
		showSkeleton,
		isStale,
		isFetching,
		refresh,
	} = useFileList({
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
					onRefresh={() => {
						void refresh();
					}}
					isRefreshing={isFetching}
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

			<DeleteConfirmDialog
				open={confirmFileName !== ""}
				fileName={confirmFileName}
				isDeleting={isDeleting}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
			/>

			<ConflictDialog
				open={conflictFiles.length > 0}
				conflictFiles={conflictFiles}
				onProcess={processUpload}
				onCancel={cancelConflictResolution}
			/>
		</>
	);
}

export { FileList };
