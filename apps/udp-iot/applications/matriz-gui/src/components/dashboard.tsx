import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@udp-iot/ui/components/card";
import { Input } from "@udp-iot/ui/components/input";
import { Progress } from "@udp-iot/ui/components/progress";
import { Slider } from "@udp-iot/ui/components/slider";
import { Switch } from "@udp-iot/ui/components/switch";
import { Check, Pencil, Power, PowerOff, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { useDeviceAliases } from "../hooks/useDeviceAliases";
import {
	isLightDevice,
	isSensorDevice,
	resolveConfigAlias,
	resolveDeviceName,
} from "../lib/deviceNaming";
import type { AppConfig, FilialData } from "../types";

export function Dashboard({
	filiais,
	config,
	onCommand,
}: {
	filiais: Record<string, FilialData>;
	config: AppConfig | null;
	onCommand: (ip: string, id: string, val: boolean | number) => void;
}) {
	const entries = Object.values(filiais);
	const { getAlias, setAlias, clearAlias } = useDeviceAliases();
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [draftAlias, setDraftAlias] = useState("");

	const beginEdit = (ip: string, dev: string, currentLabel: string) => {
		setEditingKey(`${ip}::${dev}`);
		setDraftAlias(currentLabel);
	};

	const saveEdit = (ip: string, dev: string) => {
		setAlias(ip, dev, draftAlias);
		setEditingKey(null);
		setDraftAlias("");
	};

	const cancelEdit = () => {
		setEditingKey(null);
		setDraftAlias("");
	};

	if (entries.length === 0) {
		return (
			<div className="text-center p-12 text-muted-foreground">
				Aguardando dados das filiais...
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			{entries.map((filial) => {
				const isOffline = Date.now() - filial.lastSeen > 15000;

				return (
					<Card
						key={filial.ip}
						size="sm"
						className={`border-0 shadow-md ${isOffline ? "opacity-70" : ""}`}
					>
						<CardHeader>
							<div className="flex justify-between items-start gap-3">
								<div>
									<CardTitle className="text-xl">{filial.name}</CardTitle>
									<span className="text-xs text-muted-foreground font-mono tracking-wide">
										{filial.ip}
									</span>
								</div>
								<Badge variant={isOffline ? "destructive" : "outline"}>
									{isOffline ? "Offline" : "Online"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-3">
								{filial.devices.length === 0 && (
									<div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
										Sem dispositivos reportados ainda.
									</div>
								)}
								{filial.devices.map((dev) => {
									const isLight = isLightDevice(dev);
									const isSensor = isSensorDevice(dev);
									const isLightSensor =
										isSensor && (dev.includes("light") || dev.includes("lux"));
									const val = filial.state[dev];
									const sensorValue = Number(val || 0);
									const editKey = `${filial.ip}::${dev}`;
									const uiAlias = getAlias(filial.ip, dev);
									const configAlias = resolveConfigAlias(
										filial.ip,
										dev,
										config?.deviceAliasesByIp,
										config?.deviceAliases,
									);
									const displayName = resolveDeviceName(
										dev,
										uiAlias,
										configAlias,
									);
									const editing = editingKey === editKey;

									return (
										<div
											key={dev}
											className="rounded-2xl border bg-card/70 px-4 py-3 backdrop-blur-sm"
										>
											<div className="mb-2 flex items-start justify-between gap-2">
												<div className="min-w-0">
													{editing ? (
														<Input
															value={draftAlias}
															onChange={(e) => setDraftAlias(e.target.value)}
															className="h-8"
															autoFocus
														/>
													) : (
														<p className="text-sm font-semibold truncate">
															{displayName}
														</p>
													)}
													<p className="text-[11px] font-mono text-muted-foreground truncate">
														{dev}
													</p>
												</div>

												<div className="flex items-center gap-1">
													{editing ? (
														<>
															<Button
																size="icon"
																variant="ghost"
																onClick={() => saveEdit(filial.ip, dev)}
															>
																<Check className="h-4 w-4" />
															</Button>
															<Button
																size="icon"
																variant="ghost"
																onClick={cancelEdit}
															>
																<X className="h-4 w-4" />
															</Button>
														</>
													) : (
														<>
															<Button
																size="icon"
																variant="ghost"
																onClick={() =>
																	beginEdit(filial.ip, dev, displayName)
																}
															>
																<Pencil className="h-4 w-4" />
															</Button>
															<Button
																size="icon"
																variant="ghost"
																onClick={() => clearAlias(filial.ip, dev)}
															>
																<RotateCcw className="h-4 w-4" />
															</Button>
														</>
													)}
												</div>
											</div>

											{isLightSensor ? (
												<div className="flex items-center justify-between gap-3 rounded-xl border bg-amber-50/70 px-3 py-2 dark:bg-amber-950/20">
													<div className="flex items-center gap-2">
														<div
															className={`h-2.5 w-2.5 rounded-full ${
																sensorValue > 0
																	? "bg-emerald-500"
																	: "bg-zinc-400"
															}`}
														/>
														<span
															className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
																sensorValue > 0
																	? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
																	: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
															}`}
														>
															{sensorValue > 0 ? (
																<Power className="h-3 w-3" />
															) : (
																<PowerOff className="h-3 w-3" />
															)}
															{sensorValue > 0 ? "Ligado" : "Desligado"}
														</span>
													</div>
													<span className="text-xs font-mono text-muted-foreground tabular-nums">
														{sensorValue}
													</span>
												</div>
											) : isLight ? (
												<Switch
													checked={Boolean(val)}
													onCheckedChange={(v) => onCommand(filial.ip, dev, v)}
												/>
											) : isSensor ? (
												<div className="flex items-center gap-3">
													<Progress
														value={((val as number) || 0) / 10.23}
														className="h-2.5 flex-1"
													/>
													<span className="text-xs font-mono text-muted-foreground w-12 text-right tabular-nums">
														{val ?? 0}
													</span>
												</div>
											) : (
												<div className="flex items-center gap-3">
													<Slider
														value={[(val as number) || 0]}
														onValueChange={([v]) =>
															onCommand(filial.ip, dev, v)
														}
														min={0}
														max={1023}
														className="flex-1"
													/>
													<span className="text-xs font-mono text-muted-foreground w-12 text-right tabular-nums">
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
