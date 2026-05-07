import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getFileFn } from "#/server/get-file";

export function useDownloadFile() {
	const downloadMutation = useMutation({
		mutationFn: async (id: number) => {
			const result = await getFileFn({ data: { id } });
			return result;
		},
		onSuccess: (data) => {
			if (!data) {
				toast.error("Erro ao baixar arquivo");
				return;
			}

			// Convert base64 to blob
			const byteCharacters = atob(data.value);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray]);

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = data.fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast.success(`Arquivo "${data.fileName}" baixado com sucesso!`);
		},
		onError: (error) => {
			console.error("Error downloading file:", error);
			toast.error("Erro ao baixar arquivo");
		},
	});

	const downloadFile = (id: number) => {
		downloadMutation.mutate(id);
	};

	const isDownloading = downloadMutation.isPending;

	return {
		downloadFile,
		isDownloading,
	};
}
