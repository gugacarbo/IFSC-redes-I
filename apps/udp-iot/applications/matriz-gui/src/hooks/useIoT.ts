import { useCallback, useEffect, useRef, useState } from "react";
import type { AppConfig, FilialData, LogEntry } from "../types";
import { useWebSocket } from "./useWebSocket";

const WS_URL = import.meta.env.VITE_MATRIZ_WS_URL || "ws://localhost:3001/ws";
const API_URL = import.meta.env.VITE_MATRIZ_API_URL || "http://localhost:3001";

export function useIoT() {
	const [filiais, setFiliais] = useState<Record<string, FilialData>>({});
	const [config, setConfig] = useState<AppConfig | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const configRef = useRef(config);
	configRef.current = config;

	const handleMessage = useCallback((msg: unknown) => {
		const m = msg as Record<string, unknown>;
		if (m.type === "ws_rx") {
			const ip = m.source_ip as string;
			const payload = m.payload as Record<string, unknown>;

			setFiliais((prev) => {
				const current = prev[ip] || {
					ip,
					name: configRef.current?.filiais.find((f) => f.ip === ip)?.name || ip,
					devices: [],
					state: {},
					lastSeen: 0,
				};
				const newState = { ...current.state };
				let newDevices = [...current.devices];

				if (payload.cmd === "list_resp" && Array.isArray(payload.id)) {
					newDevices = payload.id as string[];
				} else if (
					payload.cmd === "get_resp" ||
					payload.cmd === "set_resp"
				) {
					Object.keys(payload).forEach((k) => {
						if (k !== "cmd" && k !== "id" && k !== "value") {
							newState[k] = payload[k] as boolean | number;
						}
					});
					if (payload.id && payload.value !== undefined) {
						newState[payload.id as string] = payload.value as boolean | number;
					}
				}

				return {
					...prev,
					[ip]: {
						...current,
						devices: newDevices,
						state: newState,
						lastSeen: Date.now(),
					},
				};
			});
		} else if (m.type === "log") {
			setLogs((prev) => {
				const next = [
					...prev,
					{
						level: m.level as LogEntry["level"],
						message: m.message as string,
						ts: m.ts as number,
					},
				];
				return next.length > 500 ? next.slice(next.length - 500) : next;
			});
		}
	}, []);

	const { connected, send } = useWebSocket(WS_URL, handleMessage);

	const updateFiliaiNames = useCallback((cfg: AppConfig) => {
		setFiliais((prev) => {
			const next = { ...prev };
			for (const f of cfg.filiais) {
				if (next[f.ip]) {
					next[f.ip] = { ...next[f.ip], name: f.name };
				}
			}
			return next;
		});
	}, []);

	const fetchConfig = useCallback(async () => {
		try {
			const res = await fetch(`${API_URL}/api/config`);
			const data: AppConfig = await res.json();
			setConfig(data);
			updateFiliaiNames(data);
		} catch {
			console.warn("Falha ao carregar config da API");
		}
	}, [updateFiliaiNames]);

	useEffect(() => {
		fetchConfig();
	}, [fetchConfig]);

	useEffect(() => {
		if (connected) {
			fetch(`${API_URL}/api/logs`)
				.then((r) => r.json())
				.then((data: LogEntry[]) => setLogs(data.reverse()))
				.catch(() => {});
		}
	}, [connected]);

	const updateConfig = useCallback(
		async (newConfig: AppConfig) => {
			try {
				await fetch(`${API_URL}/api/config`, {
					method: "PUT",
					body: JSON.stringify(newConfig),
					headers: { "Content-Type": "application/json" },
				});
				setConfig(newConfig);
				updateFiliaiNames(newConfig);
			} catch {
				console.error("Falha ao salvar configuração");
			}
		},
		[updateFiliaiNames],
	);

	const sendCommand = useCallback(
		(targetIp: string, id: string, value: boolean | number) => {
			send({
				type: "ws_tx",
				target_ip: targetIp,
				payload: { cmd: "set_req", id, value },
			});
		},
		[send],
	);

	return {
		filiais,
		connected,
		config,
		logs,
		updateConfig,
		sendCommand,
		clearLogs: () => setLogs([]),
	};
}
