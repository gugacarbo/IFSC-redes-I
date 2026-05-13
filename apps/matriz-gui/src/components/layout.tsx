import { ReactNode } from "react";
import { Activity, Settings } from "lucide-react";

export function Layout({ children, currentTab, setTab }: { children: ReactNode, currentTab: string, setTab: (t: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">IoT Monitor</h1>
          <nav className="flex gap-4">
            <button 
              onClick={() => setTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1 rounded ${currentTab === 'dashboard' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
            >
              <Activity size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setTab('config')}
              className={`flex items-center gap-2 px-3 py-1 rounded ${currentTab === 'config' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
            >
              <Settings size={18} /> Config
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {children}
      </main>
    </div>
  );
}
