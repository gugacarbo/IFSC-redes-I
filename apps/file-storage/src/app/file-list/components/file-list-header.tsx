import { Button } from "#/app/components/ui/button";
import { CardHeader, CardTitle } from "#/app/components/ui/card";

interface FileListHeaderProps {
	totalItems: number;
	onAddFile: () => void;
	disabled?: boolean;
}

export function FileListHeader({
	totalItems,
	onAddFile,
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
			<Button onClick={onAddFile} variant="default" disabled={disabled}>
				Adicionar Arquivo
			</Button>
		</CardHeader>
	);
}
