import { Header } from "#/app/components/header";
import { FileList } from "#/app/file-list/file-list";
import { Stats } from "#/app/stats/stats";

function Home() {
	return (
		<div className="min-h-screen pb-32">
			<Header />
			<main className="container mx-auto p-4 space-y-4">
				<Stats />
				<FileList />
			</main>
		</div>
	);
}
export { Home };
