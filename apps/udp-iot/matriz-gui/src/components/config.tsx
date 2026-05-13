import { useState, useEffect } from 'react';

type MatrizConfig = {
  user: string;
  pass: string;
  polling_ms: number;
  filiais: { name: string; ip: string; port: number }[];
};

export function ConfigView() {
  const [config, setConfig] = useState<MatrizConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => window.location.hostname === 'localhost' ? 'http://192.168.1.100/api/config' : '/api/config';

  useEffect(() => {
    fetch(getApiUrl())
      .then(res => res.json())
      .then(data => { setConfig(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = () => {
    if (!config) return;
    fetch(getApiUrl(), {
      method: 'PUT',
      body: JSON.stringify(config),
      headers: { 'Content-Type': 'application/json' }
    }).then(() => alert("Salvo com sucesso!"));
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!config) return <div className="p-6 text-red-600">Falha ao carregar configurações.</div>;

  return (
    <div className="bg-white p-6 rounded shadow border">
      <h2 className="text-xl font-bold mb-6">Configurações da Matriz</h2>
      
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">Polling (ms)</label>
          <input type="number" className="border p-2 rounded w-full"
            value={config.polling_ms} 
            onChange={e => setConfig({...config, polling_ms: parseInt(e.target.value)})} />
        </div>
      </div>

      <h3 className="font-bold mb-2">Filiais Cadastradas</h3>
      <div className="space-y-3 mb-6">
        {config.filiais.map((f, idx) => (
          <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border">
            <input className="border p-1 rounded flex-1 text-sm" value={f.name} 
              onChange={e => { const n = [...config.filiais]; n[idx].name = e.target.value; setConfig({...config, filiais: n}); }} placeholder="Nome" />
            <input className="border p-1 rounded flex-1 text-sm font-mono" value={f.ip} 
              onChange={e => { const n = [...config.filiais]; n[idx].ip = e.target.value; setConfig({...config, filiais: n}); }} placeholder="IP" />
            <button onClick={() => setConfig({...config, filiais: config.filiais.filter((_, i) => i !== idx)})}
              className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200">X</button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-4">
        <button onClick={() => setConfig({...config, filiais: [...config.filiais, {name: 'Nova', ip: '', port: 51000}]})}
          className="bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300">+ Adicionar Filial</button>
        <button onClick={handleSave}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 ml-auto">Salvar Configurações</button>
      </div>
    </div>
  );
}
