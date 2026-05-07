import { OffsetPagination } from "#/app/components/offset-pagination";
import { Card, CardContent } from "#/app/components/ui/card";
import { cn } from "#/lib/utils";
import { Route } from "#/routes";
import { DragHere } from "./components/drag-here";
import { FileListContent } from "./components/file-list-content";
import { FileListHeader } from "./components/file-list-header";
import { FileListSkeleton } from "./components/file-list-skeleton";
import { SearchFile } from "./components/search-file";
import { UploadProgress } from "./components/upload-progress";
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
	} = useUploadFile();

	const deleteFile = (_: number) => {};

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
					<FileListContent files={files} onDelete={deleteFile} />
					<OffsetPagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
					/>
				</CardContent>
				<input {...getInputProps()} />
			</Card>
		</>
	);
}

export { FileList };
