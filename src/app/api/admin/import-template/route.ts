import { NextResponse } from "next/server";
import { IMPORT_CSV_TEMPLATE } from "@/lib/import-camp";
import { isAdminAuthenticated } from "@/lib/session";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }

  return new NextResponse(IMPORT_CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="grupper-og-opgaver-skabelon.csv"',
    },
  });
}
