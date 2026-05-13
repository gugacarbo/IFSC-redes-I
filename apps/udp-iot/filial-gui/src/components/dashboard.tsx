import type { DeviceInfo } from "../types";

interface DashboardProps {
  devices: DeviceInfo[];
  onSetDevice: (id: string, value: boolean | number) => void;
}

export function Dashboard({ devices, onSetDevice }: DashboardProps) {
  if (devices.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500">
        Nenhum dispositivo cadastrado.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} onSetDevice={onSetDevice} />
      ))}
    </div>
  );
}

function DeviceCard({
  device,
  onSetDevice,
}: {
  device: DeviceInfo;
  onSetDevice: (id: string, value: boolean | number) => void;
}) {
  const icon = device.isLight ? "💡" : "❄️";
  const typeLabel = device.isSensor ? "Sensor" : "Atuador";
  const typeColor = device.isSensor
    ? "bg-amber-900/40 text-amber-400"
    : "bg-blue-900/40 text-blue-400";
  const place = device.id.split("_").slice(2).join("_") || device.id;

  function handleToggle() {
    onSetDevice(device.id, !device.boolValue);
  }

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    onSetDevice(device.id, parseInt(e.target.value, 10));
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-2xl">{icon}</div>
          <h3 className="mt-1 text-sm font-medium text-zinc-100">{place}</h3>
          <p className="text-xs text-zinc-500">{device.id}</p>
        </div>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${typeColor}`}
        >
          {typeLabel}
        </span>
      </div>

      <div className="mt-3">
        {device.isLight ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Estado</span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  device.boolValue ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" : "bg-zinc-700"
                }`}
              />
              <span className="text-sm font-medium">
                {device.boolValue ? "LIGADO" : "DESLIGADO"}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Valor</span>
              <span className="text-sm font-medium">{device.intValue}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1023}
              value={device.intValue}
              disabled={device.isSensor}
              onChange={handleSlider}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}

        {!device.isSensor && device.isLight && (
          <button
            type="button"
            onClick={handleToggle}
            className={`mt-3 w-full rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              device.boolValue
                ? "bg-yellow-600/30 text-yellow-400 hover:bg-yellow-600/50"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {device.boolValue ? "Desligar" : "Ligar"}
          </button>
        )}
      </div>
    </div>
  );
}
