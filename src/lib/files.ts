import path from "path";

export type ContentFileType = "image" | "pdf" | "audio" | "video";

const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp"];
const VIDEO_EXT = [".mp4", ".webm", ".mov", ".m4v"];

export function detectFileType(filename: string): ContentFileType | null {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === ".pdf") return "pdf";
  if (ext === ".mp3") return "audio";
  if (VIDEO_EXT.includes(ext)) return "video";
  return null;
}

export function getAcceptForType(type: ContentFileType): string {
  switch (type) {
    case "image":
      return "image/png,image/jpeg,image/jpg";
    case "pdf":
      return "application/pdf,.pdf";
    case "audio":
      return "audio/mpeg,.mp3";
    case "video":
      return "video/mp4,video/webm,.mp4,.webm,.mov";
  }
}

export function getTypeLabel(type: string): string {
  switch (type) {
    case "text":
      return "Tekstblok";
    case "image":
      return "Billede";
    case "pdf":
      return "PDF";
    case "audio":
      return "Lyd (MP3)";
    case "video":
      return "Video";
    default:
      return "Fil";
  }
}

export const MAX_FILE_BYTES: Record<ContentFileType, number> = {
  image: 10 * 1024 * 1024,
  pdf: 10 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  video: 25 * 1024 * 1024,
};
