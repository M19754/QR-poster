import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { detectFileType, MAX_FILE_BYTES } from "@/lib/files";
import { getStaffSession } from "@/lib/session";
import { storeUploadedFile } from "@/lib/storage";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

async function requireGroupUploadAccess() {
  const session = await getStaffSession();
  if (!session || session.loginType !== "gruppe") {
    throw new Error("Du er logget ud. Log ind igen som gruppe.");
  }
}

/** Lokal upload uden Blob (multipart). */
async function handleLocalUpload(request: NextRequest) {
  await requireGroupUploadAccess();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Ingen fil modtaget." }, { status: 400 });
  }

  const detected = detectFileType(file.name);
  if (!detected) {
    return NextResponse.json(
      { error: `Filtypen understøttes ikke: ${file.name}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES[detected]) {
    const maxMb = Math.round(MAX_FILE_BYTES[detected] / (1024 * 1024));
    return NextResponse.json(
      { error: `Filen er for stor (max ${maxMb} MB).` },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name) || ".bin";
  const storedName = `${uuidv4()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await storeUploadedFile(storedName, buffer);

  return NextResponse.json({
    url,
    fileName: file.name,
    type: detected,
  });
}

/** Vercel Blob client-upload (store direkte fra browser). */
async function handleBlobUpload(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => {
      await requireGroupUploadAccess();
      return {
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: 25 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ scope: "group-upload" }),
      };
    },
    onUploadCompleted: async () => {},
  });

  return NextResponse.json(jsonResponse);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      return await handleLocalUpload(request);
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Fil-upload kræver Blob-lager på Vercel. Kontakt admin." },
        { status: 500 }
      );
    }

    return await handleBlobUpload(request);
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke uploade filen." },
      { status: 500 }
    );
  }
}
