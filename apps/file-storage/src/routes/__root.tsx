import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "#/app/components/theme/theme-provider";
import { Toaster } from "#/app/components/ui/sonner";
import TanStackQueryDevtools from "#/integrations/tanstack-query/devtools";
import TanStackQueryProvider from "#/integrations/tanstack-query/root-provider";
import appCss from "#/styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "IFSC - File Storage",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR">
			<head>
				<HeadContent />
			</head>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<body className="bg-background text-foreground">
					<TanStackQueryProvider>
						{children}
						<Toaster position="top-center" />
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
					</TanStackQueryProvider>
					<Scripts />
				</body>
			</ThemeProvider>
		</html>
	);
}
