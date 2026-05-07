import { Input } from "#/app/components/ui/input";
import { Search } from "lucide-react";

function SearchFile({
	value,
	onChange,
}: {
	value?: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Buscar arquivos..."
					className="pl-10"
					value={value || ""}
					onChange={(e) => onChange(e.target.value)}
				/>
			</div>
		</div>
	);
}
export { SearchFile };
