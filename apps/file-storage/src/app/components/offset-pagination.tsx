import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "#/app/components/ui/pagination";

function OffsetPagination({
	totalPages,
	currentPage,
	onPageChange,
}: {
	totalPages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
}) {
	if (!totalPages) {
		return null;
	}

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) {
					pages.push(i);
				}
				pages.push("...");
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pages.push(1);
				pages.push("...");
				for (let i = totalPages - 3; i <= totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push("...");
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push("...");
				pages.push(totalPages);
			}
		}

		return pages;
	};

	return (
		<div className="mt-6">
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							onClick={(e) => {
								e.preventDefault();
								if (currentPage > 1) {
									onPageChange(currentPage - 1);
								}
							}}
							className={
								currentPage === 1 ? "pointer-events-none opacity-50" : ""
							}
						/>
					</PaginationItem>

					{getPageNumbers().map((page, index) => (
						<PaginationItem key={index}>
							{page === "..." ? (
								<PaginationEllipsis />
							) : (
								<PaginationLink
									href="#"
									onClick={(e) => {
										e.preventDefault();
										onPageChange(page as number);
									}}
									isActive={currentPage === page}
								>
									{page}
								</PaginationLink>
							)}
						</PaginationItem>
					))}

					<PaginationItem>
						<PaginationNext
							href="#"
							onClick={(e) => {
								e.preventDefault();
								if (currentPage < totalPages) {
									onPageChange(currentPage + 1);
								}
							}}
							className={
								currentPage === totalPages
									? "pointer-events-none opacity-50"
									: ""
							}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
export { OffsetPagination };
