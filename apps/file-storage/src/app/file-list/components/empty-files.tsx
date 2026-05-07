import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#/app/components/ui/empty";
import { FileIcon } from "lucide-react";

function EmptyFiles() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<FileIcon className="h-12 w-12" />
				</EmptyMedia>
				<EmptyTitle>Nenhum arquivo encontrado</EmptyTitle>
				<EmptyDescription>Comece enviando seus arquivos</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
export { EmptyFiles };
