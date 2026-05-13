import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@udp-iot/ui/components/tabs";
import { Badge } from "@udp-iot/ui/components/badge";

interface LayoutProps {
  connected: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

export function Layout({ connected, activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-heading font-semibold tracking-wider uppercase">Filial IoT</h1>
          <Badge variant={connected ? "default" : "destructive"} className="gap-2">
            <span className={`inline-block size-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
            {connected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={onTabChange} className="mx-auto w-full max-w-5xl px-6 pt-4">
        <TabsList variant="line">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="config">Configuracao</TabsTrigger>
        </TabsList>
      </Tabs>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
        {children}
      </main>
    </div>
  );
}
