import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { deleteFileFn } from "#/server/delete-file";

export function useDeleteFile() {
	const [confirmFileName, setConfirmFileName] = useState<string>("");

	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: (fileName: string) => deleteFileFn({ data: { fileName } }),
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
			setConfirmFileName("");
		},
	});

	const requestDelete = (fileName: string) => {
		setConfirmFileName(fileName);
	};

	const confirmDelete = () => {
		if (confirmFileName) {
			deleteMutation.mutate(confirmFileName);
		}
	};

	const cancelDelete = () => {
		setConfirmFileName("");
	};

	return {
		requestDelete,
		confirmDelete,
		cancelDelete,
		isDeleting: deleteMutation.isPending,
		confirmFileName,
	};
}
