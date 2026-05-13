import { useState, useEffect } from "react";
import type { ServerConfig } from "../types";

interface ConfigProps {
  config: ServerConfig | null;
  onSave: (config: ServerConfig) => void;
}

export function Config({ config, onSave }: ConfigProps) {
  const [port, setPort] = useState("51000");
  const [adminUser, setAdminUser] = useState("admin");
  const [adminPass, setAdminPass] = useState("admin");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setPort(String(config.port));
      setAdminUser(config.adminUser);
      setAdminPass(config.adminPass);
    }
  }, [config]);

  function handleSave() {
    onSave({
      port: parseInt(port, 10) || 51000,
      adminUser,
      adminPass,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-4 text-lg font-semibold">Configuração do Servidor</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Porta UDP
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Usuário Admin
            </label>
            <input
              type="text"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Senha Admin
            </label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`w-full rounded px-4 py-2 text-sm font-medium text-white transition-colors ${
              saved
                ? "bg-green-600"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {saved ? "Salvo!" : "Salvar"}
          </button>
        </div>
      </section>
    </div>
  );
}
