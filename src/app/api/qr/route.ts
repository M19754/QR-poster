import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Manglende url" }, { status: 400 });
  }

  try {
    const buffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: { dark: "#2c2e3b", light: "#ffffff" },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Kunne ikke generere QR-kode" }, { status: 500 });
  }
}
