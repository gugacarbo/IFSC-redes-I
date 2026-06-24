import { Button } from "#/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/app/components/ui/dialog";
import { Spinner } from "#/app/components/ui/spinner";

interface DeleteConfirmDialogProps {
	open: boolean;
	fileName: string;
	isDeleting: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function DeleteConfirmDialog({
	open,
	fileName,
	isDeleting,
	onConfirm,
	onCancel,
}: DeleteConfirmDialogProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Excluir arquivo</DialogTitle>
					<DialogDescription>
						Tem certeza que deseja excluir o arquivo <strong>{fileName}</strong>
						? Esta ação não pode ser desfeita.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={isDeleting}>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<>
								<Spinner className="h-4 w-4 mr-1" />
								Excluindo...
							</>
						) : (
							"Excluir"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
