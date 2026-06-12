import Link from "next/link";
import {
  adminLogout,
  createTask,
  deleteTask,
  updateTask,
} from "@/lib/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma, getActiveCamp } from "@/lib/db";
import { requireAdminReady } from "@/lib/admin-guard";
import { getTaskPublicUrl } from "@/lib/urls";
import { QrCodeDisplay } from "@/components/QrCodeDisplay";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export default async function AdminOpgaverPage() {
  await requireAdminReady();

  const camp = await getActiveCamp();
  if (!camp) {
    return (
      <AdminShell title="Opgaver">
        <Alert>Ingen aktiv lejr fundet.</Alert>
      </AdminShell>
    );
  }

  const tasks = await prisma.task.findMany({
    where: { campId: camp.id },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      active: true,
    },
  });

  return (
    <AdminShell
      title="Opgaver"
      subtitle={camp.name}
      actions={
        <form action={adminLogout}>
          <Button type="submit" variant="secondary">
            Log ud
          </Button>
        </form>
      }
    >
      <Card>
        <form action={createTask} className="mb-6 grid gap-3 sm:grid-cols-3">
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
    </AdminShell>
  );
}
