import { FilialData } from "../hooks/useIoT";

export function Dashboard({ filiais, onCommand }: { filiais: Record<string, FilialData>, onCommand: (ip: string, id: string, val: boolean|number) => void }) {
  
  const entries = Object.values(filiais);

  if (entries.length === 0) {
    return <div className="text-center p-12 text-slate-500">Aguardando dados das filiais...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {entries.map(filial => {
        const isOffline = Date.now() - filial.lastSeen > 15000;
        
        return (
          <div key={filial.ip} className={`bg-white rounded-lg shadow border p-5 ${isOffline ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="font-bold text-lg text-slate-800">{filial.ip}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${isOffline ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>

            <div className="space-y-4">
              {filial.devices.map(dev => {
                const isLight = dev.includes('_light_');
                const isSensor = dev.startsWith('sensor_');
                const val = filial.state[dev];

                return (
                  <div key={dev} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="text-sm text-slate-700 font-medium truncate pr-2">{dev}</span>
                    
                    {isLight ? (
                      <button 
                        disabled={isSensor}
                        onClick={() => onCommand(filial.ip, dev, !val)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${val ? 'bg-emerald-500' : 'bg-slate-300'} ${isSensor ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${val ? 'left-6' : 'left-0.5'}`}></div>
                      </button>
                    ) : (
                      <input 
                        type="range" 
                        min="0" max="1023" 
                        disabled={isSensor}
                        value={(val as number) || 0}
                        onChange={(e) => onCommand(filial.ip, dev, parseInt(e.target.value))}
                        className={`w-24 ${isSensor ? 'cursor-not-allowed opacity-70' : ''}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
