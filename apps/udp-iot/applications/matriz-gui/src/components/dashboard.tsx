import type { FilialData } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "@udp-iot/ui/components/card";
import { Badge } from "@udp-iot/ui/components/badge";
import { Switch } from "@udp-iot/ui/components/switch";
import { Slider } from "@udp-iot/ui/components/slider";

export function Dashboard({
	filiais,
	onCommand,
}: {
	filiais: Record<string, FilialData>;
	onCommand: (ip: string, id: string, val: boolean | number) => void;
}) {
	const entries = Object.values(filiais);

	if (entries.length === 0) {
		return (
			<div className="text-center p-12 text-muted-foreground">
				Aguardando dados das filiais...
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{entries.map((filial) => {
				const isOffline = Date.now() - filial.lastSeen > 15000;

				return (
					<Card key={filial.ip} size="sm" className={isOffline ? "opacity-60" : ""}>
						<CardHeader>
							<div className="flex justify-between items-center">
								<div>
									<CardTitle>{filial.name}</CardTitle>
									<span className="text-xs text-muted-foreground font-mono">{filial.ip}</span>
								</div>
								<Badge variant={isOffline ? "destructive" : "outline"}>
									{isOffline ? "Offline" : "Online"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-3">
								{filial.devices.map((dev) => {
									const isLight = dev.includes("_light_");
									const isSensor = dev.startsWith("sensor_");
									const val = filial.state[dev];

									return (
										<div key={dev} className="flex justify-between items-center bg-muted p-2.5 rounded">
											<span className="text-sm font-medium truncate pr-2">{dev}</span>

											{isLight ? (
												<Switch
													checked={Boolean(val)}
													onCheckedChange={(v) => onCommand(filial.ip, dev, v)}
													disabled={isSensor}
												/>
											) : (
												<div className="flex items-center gap-2">
													<Slider
														value={[(val as number) || 0]}
														onValueChange={([v]) => onCommand(filial.ip, dev, v)}
														min={0}
														max={1023}
														disabled={isSensor}
														className="w-24"
													/>
													<span className="text-xs font-mono text-muted-foreground w-10 text-right">
														{val ?? 0}
													</span>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
