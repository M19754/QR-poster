/** Matcher qr-poster-sks-blob (private store på Vercel). */
export const BLOB_ACCESS = "private" as const;

const UPLOAD_PREFIX = "uploads/";

export function buildBlobUploadPathname(filename: string): string {
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${UPLOAD_PREFIX}${id}${ext}`;
}

export function extractBlobPathname(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    if (!url.hostname.includes(".blob.vercel-storage.com")) return null;
    return url.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

/** Omdan privat Blob-URL til app-proxy; lokale /uploads/ og andre URL'er uændret. */
export function getMediaSrc(fileUrl: string): string {
  if (!fileUrl || fileUrl.startsWith("/")) return fileUrl;
  const pathname = extractBlobPathname(fileUrl);
  if (!pathname) return fileUrl;
  return `/api/media?pathname=${encodeURIComponent(pathname)}`;
}
