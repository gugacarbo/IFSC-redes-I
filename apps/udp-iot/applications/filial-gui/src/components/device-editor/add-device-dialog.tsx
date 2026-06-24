import { Button } from "@udp-iot/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@udp-iot/ui/components/dialog";
import { Input } from "@udp-iot/ui/components/input";
import { Lightbulb, Plus, Snowflake } from "lucide-react";
import { useState } from "react";

interface AddDeviceDialogProps {
	onAdd: (id: string) => void;
}

type DeviceType = "light" | "ac";
type AccessType = "actuator" | "sensor";

export function AddDeviceDialog({ onAdd }: AddDeviceDialogProps) {
	const [deviceType, setDeviceType] = useState<DeviceType>("light");
	const [accessType, setAccessType] = useState<AccessType>("actuator");
	const [place, setPlace] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);

	const generatedId = `${accessType}_${deviceType}_${place || "..."}`;
	const isValid = place.trim().length > 0;

	function handleAdd() {
		if (!isValid) return;
		onAdd(generatedId);
		setPlace("");
		setDeviceType("light");
		setAccessType("actuator");
		setDialogOpen(false);
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<Plus className="size-4" />
					Adicionar
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar Dispositivo</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div>
						<span className="mb-1 block text-sm text-muted-foreground">
							Tipo
						</span>
						<div className="flex gap-2">
							<Button
								variant={deviceType === "light" ? "default" : "outline"}
								size="sm"
								onClick={() => setDeviceType("light")}
								className="flex-1"
							>
								<Lightbulb className="size-4" />
								Light
							</Button>
							<Button
								variant={deviceType === "ac" ? "default" : "outline"}
								size="sm"
								onClick={() => setDeviceType("ac")}
								className="flex-1"
							>
								<Snowflake className="size-4" />
								AC
							</Button>
						</div>
					</div>

					<div>
						<span className="mb-1 block text-sm text-muted-foreground">
							Acesso
						</span>
						<div className="flex gap-2">
							<Button
								variant={accessType === "actuator" ? "default" : "outline"}
								size="sm"
								onClick={() => setAccessType("actuator")}
								className="flex-1"
							>
								Atuador
							</Button>
							<Button
								variant={accessType === "sensor" ? "default" : "outline"}
								size="sm"
								onClick={() => setAccessType("sensor")}
								className="flex-1"
							>
								Sensor
							</Button>
						</div>
					</div>

					<div>
						<label
							htmlFor="device-place"
							className="mb-1 block text-sm text-muted-foreground"
						>
							Local (ex: sala, escritorio)
						</label>
						<Input
							value={place}
							onChange={(e) => setPlace(e.target.value)}
							placeholder="sala"
							id="device-place"
							onKeyDown={(e) => {
								if (e.key === "Enter" && isValid) handleAdd();
							}}
						/>
					</div>

					<div className="rounded bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
						ID: <span className="text-foreground">{generatedId}</span>
					</div>

					<Button
						disabled={!isValid}
						onClick={handleAdd}
						className="w-full"
					>
						Adicionar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
