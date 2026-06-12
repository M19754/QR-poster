import { get, head } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { BLOB_ACCESS } from "@/lib/blob-access";

function guessContentType(pathname: string, fallback: string) {
  const ext = pathname.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "mp3":
      return "audio/mpeg";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "pdf":
      return "application/pdf";
    default:
      return fallback || "application/octet-stream";
  }
}

function buildResponseHeaders(
  pathname: string,
  upstream: { get(name: string): string | null },
  meta: { contentType: string; etag: string }
) {
  const headers = new Headers();
  headers.set(
    "Content-Type",
    guessContentType(pathname, meta.contentType)
  );
  headers.set("Accept-Ranges", upstream.get("accept-ranges") ?? "bytes");
  headers.set("Cache-Control", "private, no-cache");
  headers.set("ETag", meta.etag);
  headers.set("Content-Disposition", "inline");
  headers.set("X-Content-Type-Options", "nosniff");

  const contentLength = upstream.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  const contentRange = upstream.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  return headers;
}

async function serveMedia(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");

  if (!pathname || !pathname.startsWith("uploads/")) {
    return NextResponse.json({ error: "Ugyldig filsti." }, { status: 400 });
  }

  const range = request.headers.get("range") ?? undefined;
  const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;

  try {
    const result = await get(pathname, {
      access: BLOB_ACCESS,
      ...(range ? { headers: { Range: range } } : {}),
      ...(ifNoneMatch ? { ifNoneMatch } : {}),
    });

    if (!result) {
      return new NextResponse("Fil ikke fundet.", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      });
    }

    const headers = buildResponseHeaders(pathname, result.headers, {
      contentType: result.blob.contentType,
      etag: result.blob.etag,
    });
    const status = headers.has("Content-Range") ? 206 : 200;

    return new NextResponse(result.stream, { status, headers });
  } catch (error) {
    console.error("Media proxy failed:", error);
    return new NextResponse("Fil ikke fundet.", { status: 404 });
  }
}

export async function GET(request: NextRequest) {
  return serveMedia(request);
}

export async function HEAD(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");

  if (!pathname || !pathname.startsWith("uploads/")) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const meta = await head(pathname);
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": guessContentType(pathname, meta.contentType),
        "Content-Length": String(meta.size),
        "Accept-Ranges": "bytes",
        ETag: meta.etag,
        "Cache-Control": "private, no-cache",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("Media HEAD failed:", error);
    return new NextResponse(null, { status: 404 });
  }
}
