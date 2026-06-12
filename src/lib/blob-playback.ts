import { issueSignedToken, presignUrl } from "@vercel/blob";
import type { ContentItem } from "@prisma/client";
import type { ParticipantItemView } from "@/lib/participant";
import { BLOB_ACCESS, extractBlobPathname } from "@/lib/blob-access";

const PLAYBACK_TTL_MS = 4 * 60 * 60 * 1000;

function canPresignPlayback() {
  return Boolean(process.env.BLOB_STORE_ID);
}

function needsPresignedPlayback(item: ContentItem) {
  return item.type === "video" || item.type === "audio";
}

export async function resolvePlaybackUrl(fileUrl: string): Promise<string> {
  if (fileUrl.startsWith("/")) return fileUrl;

  const pathname = extractBlobPathname(fileUrl);
  if (!pathname) return fileUrl;

  if (!canPresignPlayback()) {
    return `/api/media?pathname=${encodeURIComponent(pathname)}`;
  }

  try {
    const validUntil = Date.now() + PLAYBACK_TTL_MS;
    const issued = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(issued, {
      operation: "get",
      pathname,
      access: BLOB_ACCESS,
      validUntil,
    });
    return presignedUrl;
  } catch (error) {
    console.error("Presigned playback URL failed:", error);
    return `/api/media?pathname=${encodeURIComponent(pathname)}`;
  }
}

async function resolveParticipantItem(item: ContentItem): Promise<ContentItem> {
  if (!item.fileUrl || !needsPresignedPlayback(item)) return item;
  return { ...item, fileUrl: await resolvePlaybackUrl(item.fileUrl) };
}

export async function resolveParticipantEntries(
  entries: ParticipantItemView[]
): Promise<ParticipantItemView[]> {
  return Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      item: await resolveParticipantItem(entry.item),
    }))
  );
}
