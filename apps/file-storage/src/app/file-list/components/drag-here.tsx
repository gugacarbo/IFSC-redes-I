import { FileUp } from "lucide-react";
import { cn } from "#/lib/utils";

function DragHere({ isDragActive }: { isDragActive: boolean }) {
	return (
		<div
			className={cn(
				"pointer-events-none grid place-items-center absolute inset-0 bg-background/60 backdrop-blur-xs rounded-xl opacity-0 transition-all duration-100",
				isDragActive && "opacity-100",
			)}
		>
			<div className="flex flex-col items-center gap-2 justify-center">
				<FileUp className="size-16 text-muted-foreground" />
				<div className="text-center">
					<p className="text-lg">Arraste e solte aqui</p>
				</div>
			</div>
		</div>
	);
}
export { DragHere };
