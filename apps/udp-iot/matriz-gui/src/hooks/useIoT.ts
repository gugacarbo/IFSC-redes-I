import { useState, useEffect, useCallback, useRef } from 'react';

export type DeviceState = {
  [key: string]: boolean | number;
};

export type FilialData = {
  ip: string;
  devices: string[];
  state: DeviceState;
  lastSeen: number;
};

export function useIoT() {
  const [filiais, setFiliais] = useState<Record<string, FilialData>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Porta do WebSocket: VITE_WS_PORT do .env, ou 80 (padrao navegador)
    const wsPort = import.meta.env.VITE_WS_PORT || '';
    const host = window.location.hostname === 'localhost' ? '192.168.1.100' : window.location.hostname;
    const wsUrl = wsPort ? `ws://${host}:${wsPort}/ws` : `ws://${host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'ws_rx') {
          const ip = msg.source_ip;
          const payload = msg.payload;

          setFiliais(prev => {
            const current = prev[ip] || { ip, devices: [], state: {}, lastSeen: 0 };
            const newState = { ...current.state };
            let newDevices = [...current.devices];

            if (payload.cmd === 'list_resp' && Array.isArray(payload.id)) {
              newDevices = payload.id;
            } else if (payload.cmd === 'get_resp' || payload.cmd === 'set_resp') {
              Object.keys(payload).forEach(k => {
                if (k !== 'cmd' && k !== 'id' && k !== 'value') {
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
                lastSeen: Date.now()
              }
            };
          });
        }
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };

    return () => ws.close();
  }, []);

  const sendCommand = useCallback((targetIp: string, id: string, value: boolean | number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ws_tx',
        target_ip: targetIp,
        payload: { cmd: 'set_req', id, value }
      }));
    }
  }, []);

  return { filiais, connected, sendCommand };
}
