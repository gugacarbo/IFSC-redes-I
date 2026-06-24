import { RefreshCwIcon } from "lucide-react";
import { Button } from "#/app/components/ui/button";
import { CardHeader, CardTitle } from "#/app/components/ui/card";
import { cn } from "#/lib/cn";

interface FileListHeaderProps {
	totalItems: number;
	onAddFile: () => void;
	onRefresh: () => void;
	isRefreshing?: boolean;
	disabled?: boolean;
}

export function FileListHeader({
	totalItems,
	onAddFile,
	onRefresh,
	isRefreshing,
	disabled,
}: FileListHeaderProps) {
	return (
		<CardHeader className="flex items-center justify-between border-b">
			<div>
				<CardTitle>Arquivos</CardTitle>
				<p className="text-sm text-muted-foreground">
					{totalItems} arquivos no total
				</p>
			</div>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onRefresh}
					disabled={isRefreshing}
				>
					<RefreshCwIcon
						className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")}
					/>
					Atualizar
				</Button>
				<Button onClick={onAddFile} variant="default" disabled={disabled}>
					Adicionar Arquivo
				</Button>
			</div>
		</CardHeader>
	);
}
