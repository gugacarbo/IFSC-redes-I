import { useState, useEffect, useCallback, useRef } from "react";
import type { AppConfig, FilialData } from "../types";

const WS_URL =
  import.meta.env.VITE_MATRIZ_WS_URL || "ws://localhost:3001/ws";
const API_URL =
  import.meta.env.VITE_MATRIZ_API_URL || "http://localhost:3001";

export function useIoT() {
  const [filiais, setFiliais] = useState<Record<string, FilialData>>({});
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
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

  return { filiais, connected, config, updateConfig, sendCommand };
}
