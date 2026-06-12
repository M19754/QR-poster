import Link from "next/link";
import { redirect } from "next/navigation";
import {
  adminLogout,
  createGroup,
  createTask,
  deleteGroup,
  deleteTask,
  resetAllGroupPasswords,
  resetGroupPassword,
  resetAllParticipants,
  startNewCamp,
  updateCampSettings,
  updateGroup,
  updateTask,
} from "@/lib/actions/admin";
import { prisma, getActiveCamp } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";
import { getTaskPublicUrl } from "@/lib/urls";
import { QrCodeDisplay } from "@/components/QrCodeDisplay";
import { StaffPageShell } from "@/components/layouts/StaffLayout";
import { Alert, Badge, Button, Card, Input, Label } from "@/components/ui";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const camp = await getActiveCamp();
  if (!camp) {
    return (
      <StaffPageShell title="Admin">
        <Alert>Ingen aktiv lejr fundet. Kør database seed.</Alert>
      </StaffPageShell>
    );
  }

  const groups = await prisma.group.findMany({
    where: { campId: camp.id },
    orderBy: { sortOrder: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { campId: camp.id },
    orderBy: { sortOrder: "asc" },
  });

  const archivedCamps = await prisma.camp.findMany({
    where: { active: false },
    orderBy: { archivedAt: "desc" },
    take: 10,
  });

  return (
    <StaffPageShell
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
            <Link href="/admin/qr-print">
              <Button type="button" variant="accent">
                Print QR-plakater
              </Button>
            </Link>
            <a href="/api/admin/export">
              <Button type="button" variant="secondary">
                Eksportér lejr (JSON)
              </Button>
            </a>
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">Start ny lejr</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Arkiverer den aktuelle lejr og opretter en ny. Deltagere og koder nulstilles.
          </p>
          <form action={startNewCamp} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Navn på ny lejr</Label>
              <Input name="name" placeholder="Sommerlejr 2027" required />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="copyStructure" defaultChecked className="h-4 w-4" />
                Kopiér grupper og opgaver (uden indhold)
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="danger">
                Arkivér og start ny lejr
              </Button>
            </div>
          </form>
          {archivedCamps.length > 0 ? (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="mb-2 text-sm font-medium">Arkiverede lejre</p>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                {archivedCamps.map((c) => (
                  <li key={c.id}>
                    {c.name}
                    {c.archivedAt
                      ? ` — arkiveret ${c.archivedAt.toLocaleDateString("da-DK")}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Grupper</h2>
          <form action={createGroup} className="mb-4 grid gap-3 sm:grid-cols-4">
            <div>
              <Label>Navn</Label>
              <Input name="name" placeholder="Gruppe 4" required />
            </div>
            <div>
              <Label>Brugernavn</Label>
              <Input name="username" placeholder="Grp. 4" required />
            </div>
            <div>
              <Label>Sortering</Label>
              <Input name="sortOrder" type="number" defaultValue={groups.length + 1} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Opret gruppe
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-[var(--border)] p-4"
              >
                <form action={updateGroup} className="grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="id" value={group.id} />
                  <div>
                    <Label>Navn</Label>
                    <Input name="name" defaultValue={group.name} />
                  </div>
                  <div>
                    <Label>Brugernavn</Label>
                    <Input name="username" defaultValue={group.username} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={group.active}
                        className="h-4 w-4"
                      />
                      Aktiv
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button type="submit" variant="secondary">
                      Gem
                    </Button>
                  </div>
                </form>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge tone={group.mustChangePassword ? "warning" : "success"}>
                    {group.mustChangePassword ? "Skal skifte kode" : "Kode OK"}
                  </Badge>
                  <div className="flex flex-wrap gap-2">
                    <form action={resetGroupPassword}>
                      <input type="hidden" name="id" value={group.id} />
                      <Button type="submit" variant="accent">
                        Nulstil kode
                      </Button>
                    </form>
                    <form action={deleteGroup}>
                      <input type="hidden" name="id" value={group.id} />
                      <Button type="submit" variant="danger">
                        Slet
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Opgaver</h2>
          <form action={createTask} className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Titel</Label>
              <Input name="title" placeholder="Opgave 6 — …" required />
            </div>
            <div>
              <Label>Sortering</Label>
              <Input name="sortOrder" type="number" defaultValue={tasks.length + 1} />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit">Opret opgave</Button>
            </div>
          </form>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-[var(--border)] p-4"
              >
                <form action={updateTask} className="grid gap-3 sm:grid-cols-3">
                  <input type="hidden" name="id" value={task.id} />
                  <div className="sm:col-span-2">
                    <Label>Titel</Label>
                    <Input name="title" defaultValue={task.title} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={task.active}
                        className="h-4 w-4"
                      />
                      Aktiv
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
                    <Button type="submit" variant="secondary">
                      Gem
                    </Button>
                    <Link
                      href={getTaskPublicUrl(task.id)}
                      className="text-sm font-medium"
                      target="_blank"
                    >
                      Deltager-link →
                    </Link>
                    <code className="rounded bg-slate-100 px-2 py-1 text-xs">
                      {getTaskPublicUrl(task.id)}
                    </code>
                  </div>
                  <QrCodeDisplay url={getTaskPublicUrl(task.id)} title={task.title} />
                </form>
                <form action={deleteTask} className="mt-2 text-right">
                  <input type="hidden" name="id" value={task.id} />
                  <Button type="submit" variant="danger">
                    Slet opgave
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </StaffPageShell>
  );
}
