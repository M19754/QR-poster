import { NextResponse } from "next/server";
import { getCampExportData } from "@/lib/camp";
import { getActiveCamp } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }

  const camp = await getActiveCamp();
  if (!camp) {
    return NextResponse.json({ error: "Ingen aktiv lejr" }, { status: 404 });
  }

  const data = await getCampExportData(camp.id);
  const filename = `lejr-export-${camp.name.replace(/\s+/g, "-").toLowerCase()}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
