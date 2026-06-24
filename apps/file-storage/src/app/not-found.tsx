import { Link } from "@tanstack/react-router";
import { Button } from "#/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/app/components/ui/card";

function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Card className="mx-4 w-full max-w-md text-center">
				<CardHeader>
					<div className="mb-4 text-6xl font-bold text-muted-foreground">
						404
					</div>
					<CardTitle>Página não encontrada</CardTitle>
					<CardDescription>
						A página que você está procurando não existe ou foi movida.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Verifique o URL ou volte para a página inicial.
					</p>
				</CardContent>
				<CardFooter className="justify-center">
					<Button asChild>
						<Link to="/">Voltar ao início</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export { NotFound };
