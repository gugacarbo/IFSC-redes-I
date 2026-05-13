import { useState, useEffect } from "react";
import type { AppConfig, FilialConfig } from "../types";

const API_URL = import.meta.env.VITE_MATRIZ_API_URL || "http://localhost:3001";

export function ConfigView() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: "PUT",
        body: JSON.stringify(config),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setMsg("Configuração salva com sucesso!");
      } else {
        setMsg("Erro ao salvar configuração.");
      }
    } catch {
      setMsg("Erro de conexão ao salvar.");
    }
    setSaving(false);
  };

  const updateFilial = (idx: number, field: keyof FilialConfig, val: string | number) => {
    if (!config) return;
    const n = [...config.filiais];
    n[idx] = { ...n[idx], [field]: val };
    setConfig({ ...config, filiais: n });
  };

  const removeFilial = (idx: number) => {
    if (!config) return;
    setConfig({ ...config, filiais: config.filiais.filter((_, i) => i !== idx) });
  };

  const addFilial = () => {
    if (!config) return;
    setConfig({
      ...config,
      filiais: [...config.filiais, { name: "Nova Filial", ip: "", port: 51000 }],
    });
  };

  if (loading) return <div className="p-6 text-slate-500">Carregando...</div>;
  if (!config)
    return (
      <div className="p-6 text-red-600">Falha ao carregar configurações.</div>
    );

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
      <h2 className="text-xl font-bold mb-6 text-slate-800">
        Configurações da Matriz
      </h2>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">
            Usuário
          </label>
          <input
            type="text"
            className="border border-slate-300 p-2 rounded w-full text-sm"
            value={config.user}
            onChange={(e) => setConfig({ ...config, user: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">
            Senha
          </label>
          <input
            type="password"
            className="border border-slate-300 p-2 rounded w-full text-sm"
            value={config.pass}
            onChange={(e) => setConfig({ ...config, pass: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">
            Polling (ms)
          </label>
          <input
            type="number"
            className="border border-slate-300 p-2 rounded w-full text-sm"
            value={config.pollingMs}
            onChange={(e) =>
              setConfig({ ...config, pollingMs: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <h3 className="font-bold mb-3 text-slate-700">Filiais Cadastradas</h3>
      <div className="space-y-3 mb-6">
        {config.filiais.map((f, idx) => (
          <div
            key={idx}
            className="flex flex-wrap gap-2 items-center bg-slate-50 p-3 rounded border border-slate-200"
          >
            <input
              className="border border-slate-300 p-1.5 rounded flex-1 text-sm min-w-[120px]"
              value={f.name}
              onChange={(e) => updateFilial(idx, "name", e.target.value)}
              placeholder="Nome"
            />
            <input
              className="border border-slate-300 p-1.5 rounded flex-1 text-sm font-mono min-w-[120px]"
              value={f.ip}
              onChange={(e) => updateFilial(idx, "ip", e.target.value)}
              placeholder="IP"
            />
            <input
              type="number"
              className="border border-slate-300 p-1.5 rounded text-sm w-24 font-mono"
              value={f.port}
              onChange={(e) =>
                updateFilial(idx, "port", parseInt(e.target.value) || 0)
              }
              placeholder="Porta"
            />
            <button
              onClick={() => removeFilial(idx)}
              className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-200 font-medium"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={addFilial}
          className="bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300 font-medium text-sm"
        >
          + Adicionar Filial
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-medium text-sm ml-auto disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
        {msg && (
          <span
            className={`text-sm ml-2 ${msg.includes("sucesso") ? "text-green-600" : "text-red-600"}`}
          >
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
