import { useState, useEffect, useRef, useCallback } from "react";
import type { DeviceInfo, ServerConfig } from "../types";

const API_BASE = "http://localhost:3002";
const WS_URL = "ws://localhost:3002/ws";

export function useFilial() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "devices_updated") {
            setDevices(msg.devices);
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
      wsRef.current.send(
        JSON.stringify({ type: "set_device", id, value }),
      );
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

  const updateConfig = useCallback(
    async (newConfig: ServerConfig) => {
      await fetch(`${API_BASE}/api/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      setConfig(newConfig);
    },
    [],
  );

  return {
    devices,
    connected,
    config,
    setDevice,
    addDevice,
    removeDevice,
    updateDevice,
    updateConfig,
  };
}
