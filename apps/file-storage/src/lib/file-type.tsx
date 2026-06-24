import {
	FileIcon,
	FileTextIcon,
	ImageIcon,
	MusicIcon,
	VideoIcon,
} from "lucide-react";

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
