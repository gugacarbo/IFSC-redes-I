import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { deleteFileFn } from "#/server/delete-file";

export function useDeleteFile() {
	const [confirmFileId, setConfirmFileId] = useState<number | null>(null);
	const [confirmFileName, setConfirmFileName] = useState<string>("");

	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deleteFileFn({ data: { id } }),
		onSuccess: (response) => {
			if (response.success) {
				toast.success("Arquivo excluído com sucesso");
				queryClient.invalidateQueries({ queryKey: ["files"] });
				queryClient.invalidateQueries({ queryKey: ["fileStats"] });
			} else {
				toast.error("Erro ao excluir arquivo");
			}
		},
		onError: (error) => {
			toast.error(
				`Erro ao excluir arquivo: ${error instanceof Error ? error.message : ""}`,
			);
		},
		onSettled: () => {
			setConfirmFileId(null);
			setConfirmFileName("");
		},
	});

	const requestDelete = (id: number, fileName: string) => {
		setConfirmFileId(id);
		setConfirmFileName(fileName);
	};

	const confirmDelete = () => {
		if (confirmFileId !== null) {
			deleteMutation.mutate(confirmFileId);
		}
	};

	const cancelDelete = () => {
		setConfirmFileId(null);
		setConfirmFileName("");
	};

	return {
		requestDelete,
		confirmDelete,
		cancelDelete,
		isDeleting: deleteMutation.isPending,
		confirmFileId,
		confirmFileName,
	};
}
