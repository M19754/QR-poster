export const dynamic = "force-dynamic";

import { getActiveCamp } from "@/lib/db";
import { RecoverSessionClient } from "./RecoverSessionClient";
import { Card } from "@/components/ui";

export default async function VelkommenPage() {
  const camp = await getActiveCamp();

  const welcomeText =
    camp?.welcomeText?.trim() ||
    "Scan QR-koden fra dine ledere for at komme i gang.";

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <Card className="text-center">
          <p className="mb-2 text-xs text-[var(--muted)]">{camp?.name ?? "Lejr"}</p>
          <h1 className="mb-4 text-2xl font-bold">Velkommen!</h1>
          <p className="whitespace-pre-wrap text-sm text-[var(--text)]">{welcomeText}</p>
        </Card>

        <RecoverSessionClient />
      </div>
    </div>
  );
}
