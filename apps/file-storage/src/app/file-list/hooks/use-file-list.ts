import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { listFilesFn } from "#/server/list-files";

interface UseFileListOptions {
	offset: number;
	limit: number;
	search?: string;
	onInvalidOffset?: (lastValidOffset: number) => void;
}

export function useFileList({
	offset,
	limit,
	search,
	onInvalidOffset,
}: UseFileListOptions) {
	const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
		queryKey: ["files", offset, limit, search],
		queryFn: () =>
			listFilesFn({
				data: {
					offset,
					limit,
					search,
				},
			}),
		placeholderData: (previousData) => previousData,
	});

	const totalPages = Math.ceil((data?.total || 0) / limit);
	const currentPage = Math.floor(offset / limit) + 1;

	// Redirect to last valid page if offset is beyond total results
	useEffect(() => {
		if (data && data.total > 0 && offset >= data.total) {
			const lastValidOffset = Math.max(0, (totalPages - 1) * limit);
			onInvalidOffset?.(lastValidOffset);
		}
	}, [data, offset, limit, totalPages, onInvalidOffset]);

	const files = data?.files || [];
	const totalItems = data?.total || 0;

	const showSkeleton = isLoading && files.length === 0;
	const isStale = isFetching && isPlaceholderData && files.length > 0;

	return {
		files,
		totalItems,
		totalPages,
		currentPage,
		isLoading,
		isFetching,
		isPlaceholderData,
		showSkeleton,
		isStale,
	};
}
