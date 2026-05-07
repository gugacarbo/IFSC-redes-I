import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import {
	FileIcon,
	FileTextIcon,
	ImageIcon,
	MusicIcon,
	VideoIcon,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatFileSize = (bytes?: number) => {
	if (!bytes || bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

export const formatDate = (date: Date | string) => {
	const date_ =
		typeof date === "string" ? new Date(date) : (date ?? new Date());

	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date_);
};

export const getFileIcon = (type: string) => {
	switch (type) {
		case "pdf":
			return <FileTextIcon className="h-5 w-5 text-red-500" />;
		case "image":
			return <ImageIcon className="h-5 w-5 text-purple-500" />;
		case "video":
			return <VideoIcon className="h-5 w-5 text-blue-500" />;
		case "audio":
			return <MusicIcon className="h-5 w-5 text-green-500" />;
		default:
			return <FileIcon className="h-5 w-5 text-gray-500" />;
	}
};

export const getFileType = (path: string) => {
	const extension = path.split(".").pop()?.toLowerCase();

	switch (extension) {
		case "pdf":
			return "pdf";
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "webp":
		case "svg":
		case "bmp":
		case "ico":
			return "image";
		case "mp4":
		case "avi":
		case "mov":
		case "wmv":
		case "flv":
		case "webm":
		case "mkv":
			return "video";
		case "mp3":
		case "wav":
		case "ogg":
		case "flac":
		case "aac":
		case "wma":
		case "m4a":
			return "audio";
		default:
			return "file";
	}
};
