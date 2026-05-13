import { ReactNode } from "react";
import { Activity, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@udp-iot/ui/components/tabs";
import { Badge } from "@udp-iot/ui/components/badge";

export function Layout({
	children,
	currentTab,
	setTab,
	connected,
}: {
	children: ReactNode;
	currentTab: string;
	setTab: (t: string) => void;
	connected: boolean;
}) {
	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<header className="bg-primary text-primary-foreground p-4 shadow-md">
				<div className="max-w-6xl mx-auto flex justify-between items-center">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-heading font-semibold tracking-wider uppercase">IoT Monitor</h1>
						<span className={`inline-block size-3 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} title={connected ? "Conectado" : "Desconectado"} />
					</div>
					<Tabs value={currentTab} onValueChange={setTab}>
						<TabsList variant="line" className="[&>button]:text-primary-foreground/70 [&>button]:data-active:text-primary-foreground">
							<TabsTrigger value="dashboard">
								<Activity className="size-4" />
								Dashboard
							</TabsTrigger>
							<TabsTrigger value="config">
								<Settings className="size-4" />
								Config
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</header>
			<main className="flex-1 max-w-6xl mx-auto w-full p-6">
				{children}
			</main>
		</div>
	);
}
