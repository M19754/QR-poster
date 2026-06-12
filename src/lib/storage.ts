import { mkdir, writeFile } from "fs/promises";
import path from "path";

/** Gem fil — lokalt i dev, Vercel Blob i produktion. */
export async function storeUploadedFile(
  storedName: string,
  buffer: Buffer
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${storedName}`, buffer, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("BLOB_READ_WRITE_TOKEN mangler på Vercel.");
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, storedName), buffer);
  return `/uploads/${storedName}`;
}
