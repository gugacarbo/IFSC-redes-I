import { Button } from "@udp-iot/ui/components/button";

interface GroupToggleProps {
	groupBy: "place" | "type";
	onChange: (v: "place" | "type") => void;
}

export function GroupToggle({ groupBy, onChange }: GroupToggleProps) {
	return (
		<div className="flex gap-0.5 rounded bg-muted p-0.5 self-start">
			<Button
				variant={groupBy === "place" ? "default" : "ghost"}
				size="xs"
				onClick={() => onChange("place")}
			>
				Local
			</Button>
			<Button
				variant={groupBy === "type" ? "default" : "ghost"}
				size="xs"
				onClick={() => onChange("type")}
			>
				Tipo
			</Button>
		</div>
	);
}
