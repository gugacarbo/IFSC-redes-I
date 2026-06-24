import { Badge } from "@udp-iot/ui/components/badge";
import { Button } from "@udp-iot/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useDarkMode } from "../hooks/useDarkMode";

const navItems = [
	{ to: "/", label: "Dashboard" },
	{ to: "/devices", label: "Dispositivos" },
	{ to: "/config", label: "Configuracao" },
	{ to: "/console", label: "Console" },
];

interface LayoutProps {
	connected: boolean;
}

export function Layout({ connected }: LayoutProps) {
	const { isDark, toggle } = useDarkMode();

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<header className="border-b px-6 py-4">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
					<div className="flex items-center gap-6">
						<h1 className="text-xl font-heading font-semibold tracking-wider uppercase">
							Filial IoT
						</h1>
						<nav className="flex items-center gap-4">
							{navItems.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									end={item.to === "/"}
									className={({ isActive }) =>
										`text-sm font-medium transition-colors ${
											isActive
												? "text-foreground"
												: "text-muted-foreground hover:text-foreground"
										}`
									}
								>
									{item.label}
								</NavLink>
							))}
						</nav>
					</div>
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

			<main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
				<Outlet />
			</main>
		</div>
	);
}
