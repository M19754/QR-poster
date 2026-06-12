import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { BLOB_ACCESS } from "@/lib/blob-access";

function canUseVercelBlob() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
  );
}

/** Gem fil — Vercel Blob (OIDC eller token) i produktion, lokalt i public/uploads. */
export async function storeUploadedFile(
  storedName: string,
  buffer: Buffer
): Promise<string> {
  if (canUseVercelBlob()) {
    const blob = await put(`uploads/${storedName}`, buffer, {
      access: BLOB_ACCESS,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, storedName), buffer);
  return `/uploads/${storedName}`;
}
