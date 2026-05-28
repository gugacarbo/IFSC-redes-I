// launcher/src/ui/components/Layout.tsx
import { Box, Spacer, Text } from "ink";
import type { ReactNode } from "react";

const ALL_MENU_ITEMS: Record<string, string> = {
	Enter: "Selecionar",
	"q/Esc": "Sair",
	n: "Novo",
	d: "Docs",
	t: "Terminais",
	Esc: "Voltar",
	Setas: "Navegar",
	"Setas/j/k": "Rolar",
	"PgUp/PgDn": "Rolar rápido",
	"Esc/d/b": "Voltar",
	k: "Fechar",
	x: "Fechar todos",
	c: "Limpar",
	"Esc/b": "Voltar",
	b: "Voltar",
};

interface LayoutProps {
	title?: string;
	activeMenus?: Record<string, boolean>;
	footer?: ReactNode;
	side?: ReactNode;
	children: ReactNode;
}

export function Layout({
	title,
	activeMenus,
	footer,
	side,
	children,
}: LayoutProps) {
	const visibleMenus = activeMenus
		? Object.entries(activeMenus)
				.filter(([, active]) => active)
				.map(([key]) => ({
					key,
					desc: ALL_MENU_ITEMS[key] ?? key,
				}))
		: [];

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			paddingX={1}
			paddingY={0}
			width="100%"
			height="100%"
		>
			{title && (
				<Text bold color="cyan">
					{title}
				</Text>
			)}
			{visibleMenus.length > 0 && (
				<Box>
					<Text dimColor>
						{visibleMenus.map((cmd, i) => (
							<Text key={cmd.key}>
								{i > 0 && <Text dimColor>  </Text>}
								<Text bold color="yellow">
									{cmd.key}
								</Text>
								<Text dimColor> {cmd.desc}</Text>
							</Text>
						))}
					</Text>
				</Box>
			)}
			<Spacer />
			<Box flexDirection="row" flexGrow={1} width="100%">
				<Box flexDirection="column" flexGrow={1}>
					{children}
				</Box>
				{side && (
					<Box flexDirection="column" marginLeft={1}>
						{side}
					</Box>
				)}
			</Box>
			{footer && (
				<Box marginTop={1} width="100%">
					{footer}
				</Box>
			)}
		</Box>
	);
}
