import { useCallback, useEffect, useRef, useState } from "react";
import type { AppConfig, FilialData, LogEntry } from "../types";

const WS_URL =
	import.meta.env.VITE_MATRIZ_WS_URL ||
	`ws://localhost:${import.meta.env.VITE_MATRIZ_PORT || 8080}/ws`;
const API_URL =
	import.meta.env.VITE_MATRIZ_API_URL ||
	`http://localhost:${import.meta.env.VITE_MATRIZ_PORT || 8080}`;

export function useIoT() {
	const [filiais, setFiliais] = useState<Record<string, FilialData>>({});
	const [connected, setConnected] = useState(false);
	const [config, setConfig] = useState<AppConfig | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const backoffRef = useRef(1000);

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) return;

		const ws = new WebSocket(WS_URL);
		wsRef.current = ws;

		ws.onopen = () => {
			setConnected(true);
			backoffRef.current = 1000;
			// Fetch log backlog from server
			fetch(`${API_URL}/api/logs`)
				.then((r) => r.json())
				.then((data: LogEntry[]) => setLogs(data.reverse()))
				.catch(() => {});
		};

		ws.onclose = () => {
			setConnected(false);
			wsRef.current = null;
			const delay = backoffRef.current;
			backoffRef.current = Math.min(backoffRef.current * 2, 30000);
			reconnectTimer.current = setTimeout(connect, delay);
		};

		ws.onmessage = (e) => {
			try {
				const msg = JSON.parse(e.data);
				if (msg.type === "ws_rx") {
					const ip = msg.source_ip;
					const payload = msg.payload;

					setFiliais((prev) => {
						const current = prev[ip] || {
							ip,
							name: config?.filiais.find((f) => f.ip === ip)?.name || ip,
							devices: [],
							state: {},
							lastSeen: 0,
						};
						const newState = { ...current.state };
						let newDevices = [...current.devices];

						if (payload.cmd === "list_resp" && Array.isArray(payload.id)) {
							newDevices = payload.id;
						} else if (
							payload.cmd === "get_resp" ||
							payload.cmd === "set_resp"
						) {
							Object.keys(payload).forEach((k) => {
								if (k !== "cmd" && k !== "id" && k !== "value") {
									newState[k] = payload[k];
								}
							});
							if (payload.id && payload.value !== undefined) {
								newState[payload.id] = payload.value;
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
				} else if (msg.type === "log") {
					setLogs((prev) => {
						const next = [...prev, { level: msg.level, message: msg.message, ts: msg.ts }];
						return next.length > 500 ? next.slice(next.length - 500) : next;
					});
				}
			} catch (err) {
				console.error("WS Parse error", err);
			}
		};
	}, [config]);

	useEffect(() => {
		connect();
		return () => {
			if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
			wsRef.current?.close();
		};
	}, [connect]);

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
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				wsRef.current.send(
					JSON.stringify({
						type: "ws_tx",
						target_ip: targetIp,
						payload: { cmd: "set_req", id, value },
					}),
				);
			}
		},
		[],
	);

	return { filiais, connected, config, logs, updateConfig, sendCommand, clearLogs: () => setLogs([]) };
}
