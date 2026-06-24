import { Skeleton } from "#/app/components/ui/skeleton";

interface FileListSkeletonProps {
	count?: number;
}

export function FileListSkeleton({ count = 5 }: FileListSkeletonProps) {
	return (
		<>
			{Array.from({ length: count }).map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: pq sim
					key={i}
					className="flex items-center justify-between mb-4 rounded-lg"
				>
					<div className="flex items-center gap-2 w-1/2 min-w-32">
						<Skeleton className="size-12" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-8 w-20" />
					</div>
				</div>
			))}
		</>
	);
}
