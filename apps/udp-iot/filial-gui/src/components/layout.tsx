import type { ReactNode } from "react";

interface LayoutProps {
  connected: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

export function Layout({ connected, activeTab, onTabChange, children }: LayoutProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "devices", label: "Dispositivos" },
    { id: "config", label: "Configuração" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">Filial IoT</h1>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-zinc-400">
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>
      </header>

      <nav className="border-b border-zinc-800 px-6">
        <div className="mx-auto flex max-w-5xl gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {children}
      </main>
    </div>
  );
}
