import { useQuery } from "@tanstack/react-query";
import { FileIcon, FileUp, Upload } from "lucide-react";

import { formatFileSize } from "#/lib/utils";
import { getFileStatsFn } from "#/server/get-file-stats";
import { StatCard } from "./stat-card";

function Stats() {
	const { data: statsData, isLoading } = useQuery({
		queryKey: ["stats"],
		queryFn: getFileStatsFn,
	});

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<StatCard
				label={"Arquivos Totais"}
				value={statsData?.count}
				isLoading={isLoading}
				icon={<FileUp />}
			/>
			<StatCard
				label={"Espaço Utilizado"}
				value={formatFileSize(statsData?.totalSize)}
				isLoading={isLoading}
				icon={<FileIcon />}
			/>
			<StatCard
				label={"Uploads Hoje"}
				value={statsData?.uploadsToday}
				isLoading={isLoading}
				icon={<Upload />}
			/>
		</div>
	);
}
export { Stats };
