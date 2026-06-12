import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { BLOB_ACCESS } from "@/lib/blob-access";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");

  if (!pathname || !pathname.startsWith("uploads/")) {
    return NextResponse.json({ error: "Ugyldig filsti." }, { status: 400 });
  }

  try {
    const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;
    const result = await get(pathname, {
      access: BLOB_ACCESS,
      ifNoneMatch,
    });

    if (!result) {
      return new NextResponse("Fil ikke fundet.", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": result.blob.cacheControl,
        },
      });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "application/octet-stream",
        "Content-Disposition": result.blob.contentDisposition,
        "Cache-Control": result.blob.cacheControl,
        ETag: result.blob.etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Media proxy failed:", error);
    return new NextResponse("Fil ikke fundet.", { status: 404 });
  }
}
