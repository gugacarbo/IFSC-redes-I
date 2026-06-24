import { AlertTriangleIcon } from "lucide-react";
import { Button } from "#/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/app/components/ui/dialog";
import type { ConflictAction } from "../lib/upload-utils";

interface ConflictDialogProps {
	open: boolean;
	conflictFiles: string[];
	onProcess: (action: ConflictAction) => void;
	onCancel: () => void;
}

export function ConflictDialog({
	open,
	conflictFiles,
	onProcess,
	onCancel,
}: ConflictDialogProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) onCancel();
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
					<Button variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
					<Button variant="secondary" onClick={() => onProcess("rename")}>
						Renomear novos
					</Button>
					<Button variant="default" onClick={() => onProcess("overwrite")}>
						Substituir
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
