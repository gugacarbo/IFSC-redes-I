import { useCallback, useEffect, useRef, useState } from "react";

export function useWebSocket(
	url: string,
	onMessage: (msg: unknown) => void,
) {
	const [connected, setConnected] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const backoffRef = useRef(1000);
	const onMessageRef = useRef(onMessage);
	onMessageRef.current = onMessage;

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) return;

		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			setConnected(true);
			backoffRef.current = 1000;
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
				onMessageRef.current(JSON.parse(e.data));
			} catch (err) {
				console.error("WS Parse error", err);
			}
		};
	}, [url]);

	useEffect(() => {
		connect();
		return () => {
			if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
			wsRef.current?.close();
		};
	}, [connect]);

	const send = useCallback((data: unknown) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(data));
		}
	}, []);

	return { connected, send };
}
