import Link from "next/link";
import {
  adminLogout,
  importCampStructure,
  resetAllGroupPasswords,
  resetAllParticipants,
  startNewCamp,
  updateCampSettings,
} from "@/lib/actions/admin";
import { ImportCampForm } from "@/components/ImportCampForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma, getActiveCamp } from "@/lib/db";
import { requireAdminReady } from "@/lib/admin-guard";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export default async function AdminForsidePage({
  searchParams,
}: {
  searchParams: Promise<{ importOk?: string; importError?: string }>;
}) {
  await requireAdminReady();

  const { importOk, importError } = await searchParams;
  const camp = await getActiveCamp();
  if (!camp) {
    return (
      <AdminShell title="Admin">
        <Alert>Ingen aktiv lejr fundet. Kør database seed.</Alert>
      </AdminShell>
    );
  }

  const archivedCamps = await prisma.camp.findMany({
    where: { active: false },
    orderBy: { archivedAt: "desc" },
    take: 10,
    select: { id: true, name: true, archivedAt: true },
  });

  return (
    <AdminShell
      title="Admin"
      subtitle={`${camp.name} · deltager-epoke ${camp.participantEpoch}`}
      actions={
        <form action={adminLogout}>
          <Button type="submit" variant="secondary">
            Log ud
          </Button>
        </form>
      }
    >
      <div className="space-y-6">
        {importOk ? (
          <Alert variant="success">Import fuldført: {decodeURIComponent(importOk)}</Alert>
        ) : null}
        {importError ? (
          <Alert>
            Import fejlede:{" "}
            {importError === "no-file"
              ? "Vælg en fil først."
              : importError === "no-camp"
                ? "Ingen aktiv lejr."
                : decodeURIComponent(importError)}
          </Alert>
        ) : null}

        <Card>
          <h2 className="mb-2 text-lg font-semibold">Import / eksport</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Download skabelonen, udfyld i Excel, og upload CSV-filen.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <a href="/api/admin/import-template">
              <Button type="button" variant="secondary">
                Download skabelon (CSV)
              </Button>
            </a>
            <a href="/api/admin/export">
              <Button type="button" variant="secondary">
                Eksportér lejr (JSON)
              </Button>
            </a>
            <Link href="/admin/qr-print">
              <Button type="button" variant="accent">
                Print QR-plakater
              </Button>
            </Link>
          </div>
          <ImportCampForm action={importCampStructure} />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Lejr-indstillinger</h2>
          <form action={updateCampSettings} className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Lejr-navn</Label>
              <Input name="name" defaultValue={camp.name} />
            </div>
            <div>
              <Label>Standard gruppekode</Label>
              <Input name="defaultPassword" defaultValue={camp.defaultPassword} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Gem indstillinger</Button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={resetAllGroupPasswords}>
              <Button type="submit" variant="secondary">
                Nulstil alle gruppekoder
              </Button>
            </form>
            <form action={resetAllParticipants}>
              <Button type="submit" variant="danger">
                Nulstil alle deltagere
              </Button>
            </form>
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">Start ny lejr</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Arkiverer den aktuelle lejr og opretter en ny.
          </p>
          <form action={startNewCamp} className="grid gap-3">
            <div>
              <Label>Navn på ny lejr</Label>
              <Input name="name" placeholder="Sommerlejr 2027" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="copyStructure" defaultChecked className="h-4 w-4" />
              Kopiér grupper og opgaver (uden indhold)
            </label>
            <Button type="submit" variant="danger">
              Arkivér og start ny lejr
            </Button>
          </form>
          {archivedCamps.length > 0 ? (
            <ul className="mt-4 space-y-1 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
              {archivedCamps.map((c) => (
                <li key={c.id}>
                  {c.name}
                  {c.archivedAt
                    ? ` — arkiveret ${c.archivedAt.toLocaleDateString("da-DK")}`
                    : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
    </AdminShell>
  );
}
