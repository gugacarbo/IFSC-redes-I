import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@udp-iot/ui/components/tabs";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useDarkMode } from "../hooks/useDarkMode";

interface LayoutProps {
	connected: boolean;
	activeTab: string;
	onTabChange: (tab: string) => void;
	children: ReactNode;
}

export function Layout({
	connected,
	activeTab,
	onTabChange,
	children,
}: LayoutProps) {
	const { isDark, toggle } = useDarkMode();

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<header className="border-b px-6 py-4">
				<div className="mx-auto flex max-w-5xl items-center justify-between">
					<h1 className="text-xl font-heading font-semibold tracking-wider uppercase">
						Filial IoT
					</h1>
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={toggle}
							title={isDark ? "Modo claro" : "Modo escuro"}
						>
							{isDark ? (
								<Sun className="size-4" />
							) : (
								<Moon className="size-4" />
							)}
						</Button>
						<Badge
							variant={connected ? "default" : "destructive"}
							className="gap-2"
						>
							<span
								className={`inline-block size-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
							/>
							{connected ? "Conectado" : "Desconectado"}
						</Badge>
					</div>
				</div>
			</header>

			<Tabs
				value={activeTab}
				onValueChange={onTabChange}
				className="mx-auto w-full max-w-5xl px-6 pt-4"
			>
				<TabsList variant="line">
					<TabsTrigger value="dashboard">Dashboard</TabsTrigger>
					<TabsTrigger value="devices">Dispositivos</TabsTrigger>
					<TabsTrigger value="config">Configuracao</TabsTrigger>
					<TabsTrigger value="console">Console</TabsTrigger>
				</TabsList>
			</Tabs>

			<main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
				{children}
			</main>
		</div>
	);
}
