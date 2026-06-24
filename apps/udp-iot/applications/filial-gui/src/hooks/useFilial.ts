import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceInfo, LogEntry, ServerConfig } from "../types";

const FILIAL_GUI_PORT = import.meta.env.VITE_FILIAL_GUI_PORT || "8082";
const API_BASE =
	import.meta.env.VITE_FILIAL_API_URL || `http://localhost:${FILIAL_GUI_PORT}`;
const WS_URL =
	import.meta.env.VITE_FILIAL_WS_URL || `ws://localhost:${FILIAL_GUI_PORT}/ws`;

export function useFilial() {
	const [devices, setDevices] = useState<DeviceInfo[]>([]);
	const [connected, setConnected] = useState(false);
	const [config, setConfig] = useState<ServerConfig | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const fetchDevices = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/api/devices`);
			if (res.ok) setDevices(await res.json());
		} catch {
			// server not ready yet
		}
	}, []);

	const fetchConfig = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/api/config`);
			if (res.ok) setConfig(await res.json());
		} catch {
			// server not ready yet
		}
	}, []);

	useEffect(() => {
		fetchDevices();
		fetchConfig();
	}, [fetchDevices, fetchConfig]);

	useEffect(() => {
		function connect() {
			const ws = new WebSocket(WS_URL);
			ws.onopen = () => {
				setConnected(true);
				fetch(`${API_BASE}/api/logs`)
					.then((r) => r.json())
					.then((data: LogEntry[]) => setLogs(data.reverse()))
					.catch(() => {});
			};
			ws.onclose = () => {
				setConnected(false);
				reconnectTimer.current = setTimeout(connect, 3000);
			};
			ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					if (msg.type === "devices_updated") {
						setDevices(msg.devices);
					} else if (msg.type === "log") {
						setLogs((prev) => {
							const next = [
								...prev,
								{ level: msg.level, message: msg.message, ts: msg.ts },
							];
							return next.length > 500 ? next.slice(next.length - 500) : next;
						});
					}
				} catch {
					// ignore malformed messages
				}
			};
			wsRef.current = ws;
		}

		connect();

		return () => {
			if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
			wsRef.current?.close();
		};
	}, []);

	const setDevice = useCallback((id: string, value: boolean | number) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: "set_device", id, value }));
		}
	}, []);

	const addDevice = useCallback(async (id: string) => {
		await fetch(`${API_BASE}/api/devices`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
	}, []);

	const removeDevice = useCallback(async (id: string) => {
		await fetch(`${API_BASE}/api/devices/${encodeURIComponent(id)}`, {
			method: "DELETE",
		});
	}, []);

	const updateDevice = useCallback(async (oldId: string, newId: string) => {
		await fetch(`${API_BASE}/api/devices/${encodeURIComponent(oldId)}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ newId }),
		});
	}, []);

	const updateConfig = useCallback(async (newConfig: ServerConfig) => {
		const res = await fetch(`${API_BASE}/api/config`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(newConfig),
		});
		if (res.ok) {
			setConfig(await res.json());
		}
	}, []);

	return {
		devices,
		connected,
		config,
		logs,
		clearLogs: () => setLogs([]),
		setDevice,
		addDevice,
		removeDevice,
		updateDevice,
		updateConfig,
	};
}
