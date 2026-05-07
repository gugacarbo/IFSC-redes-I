import { Card } from "#/app/components/ui/card";
import { Skeleton } from "#/app/components/ui/skeleton";

function StatCard({
	label,
	value,
	icon,
	isLoading,
}: {
	label: string;
	value?: number | string;
	icon: React.ReactElement;
	isLoading: boolean;
}) {
	return (
		<Card className="p-6 relative">
			{isLoading && <Skeleton className="absolute inset-0" />}
			<div className="flex items-center gap-4">
				<div className="size-12 text-primary bg-primary/10 rounded-lg flex items-center justify-center [&>svg]:size-6 ">
					{icon}
				</div>
				<div>
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="text-2xl font-bold">{value || 0}</p>
				</div>
			</div>
		</Card>
	);
}

export { StatCard };
