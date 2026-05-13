import { useState } from "react";
import type { DeviceInfo } from "../types";

interface DeviceEditorProps {
  devices: DeviceInfo[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (oldId: string, newId: string) => void;
}

type DeviceType = "light" | "ac";
type AccessType = "actuator" | "sensor";

export function DeviceEditor({ devices, onAdd, onRemove, onRename }: DeviceEditorProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>("light");
  const [accessType, setAccessType] = useState<AccessType>("actuator");
  const [place, setPlace] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const generatedId = `${accessType}_${deviceType}_${place || "..."}`;
  const isValid = place.trim().length > 0;

  function handleAdd() {
    if (!isValid) return;
    onAdd(generatedId);
    setPlace("");
  }

  function handleRename(oldId: string) {
    if (!newName.trim()) return;
    const parts = oldId.split("_");
    const prefix = parts.slice(0, 2).join("_");
    onRename(oldId, `${prefix}_${newName.trim()}`);
    setRenamingId(null);
    setNewName("");
  }

  function handleRemove(id: string) {
    if (window.confirm(`Remover dispositivo "${id}"?`)) {
      onRemove(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Device */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-4 text-lg font-semibold">Adicionar Dispositivo</h2>

        <div className="mb-3">
          <label className="mb-1 block text-sm text-zinc-400">Tipo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeviceType("light")}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                deviceType === "light"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              💡 Light
            </button>
            <button
              type="button"
              onClick={() => setDeviceType("ac")}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                deviceType === "ac"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              ❄️ AC
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm text-zinc-400">Acesso</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAccessType("actuator")}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                accessType === "actuator"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Atuador
            </button>
            <button
              type="button"
              onClick={() => setAccessType("sensor")}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                accessType === "sensor"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Sensor
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm text-zinc-400">
            Local (ex: sala, escritorio)
          </label>
          <input
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="sala"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="mb-4 rounded bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-400">
          ID: <span className="text-zinc-200">{generatedId}</span>
        </div>

        <button
          type="button"
          disabled={!isValid}
          onClick={handleAdd}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Adicionar
        </button>
      </section>

      {/* Device List */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-4 text-lg font-semibold">
          Dispositivos ({devices.length})
        </h2>

        {devices.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum dispositivo.</p>
        ) : (
          <ul className="space-y-2">
            {devices.map((device) => (
              <li
                key={device.id}
                className="flex items-center justify-between rounded bg-zinc-800 px-3 py-2"
              >
                {renamingId === device.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(device.id);
                        if (e.key === "Escape") {
                          setRenamingId(null);
                          setNewName("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(device.id)}
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(null);
                        setNewName("");
                      }}
                      className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-600"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span>{device.isLight ? "💡" : "❄️"}</span>
                      <span className="text-sm font-mono text-zinc-200">
                        {device.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const parts = device.id.split("_");
                          setRenamingId(device.id);
                          setNewName(parts.slice(2).join("_"));
                        }}
                        className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                        title="Renomear"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(device.id)}
                        className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/40"
                        title="Remover"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
