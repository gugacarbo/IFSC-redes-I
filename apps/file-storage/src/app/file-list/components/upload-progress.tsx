import { Progress } from "#/app/components/ui/progress";

interface UploadProgressItem {
	fileName: string;
	progress: number;
}

interface UploadProgressProps {
	progress: UploadProgressItem[];
}

export function UploadProgress({ progress }: UploadProgressProps) {
	if (progress.length === 0) return null;

	// Calculate overall progress
	const overallProgress =
		progress.reduce((sum, item) => sum + item.progress, 0) / progress.length;

	return (
		<div className="mb-4">
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm font-medium">
					Enviando {progress.length} arquivo{progress.length > 1 ? "s" : ""}...
				</span>
				<span className="text-sm text-muted-foreground">
					{Math.round(overallProgress)}%
				</span>
			</div>
			<Progress value={overallProgress} className="h-2" />
			{progress.length > 1 && (
				<div className="mt-2 space-y-1">
					{progress.map((item) => (
						<div
							key={item.fileName}
							className="flex items-center justify-between text-xs text-muted-foreground"
						>
							<span className="truncate max-w-50">{item.fileName}</span>
							<span>{Math.round(item.progress)}%</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
