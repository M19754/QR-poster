import Link from "next/link";
import {
  adminLogout,
  createGroup,
  deleteGroup,
  resetGroupPassword,
  updateGroup,
} from "@/lib/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma, getActiveCamp } from "@/lib/db";
import { requireAdminReady } from "@/lib/admin-guard";
import { Alert, Badge, Button, Card, Input, Label } from "@/components/ui";

export default async function AdminGrupperPage() {
  await requireAdminReady();

  const camp = await getActiveCamp();
  if (!camp) {
    return (
      <AdminShell title="Grupper">
        <Alert>Ingen aktiv lejr fundet.</Alert>
      </AdminShell>
    );
  }

  const groups = await prisma.group.findMany({
    where: { campId: camp.id },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { taskContents: true } },
    },
  });

  return (
    <AdminShell
      title="Grupper"
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
        <form action={createGroup} className="mb-6 grid gap-3 sm:grid-cols-4">
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
                <div className="flex items-end">
                  <Button type="submit" variant="secondary">
                    Gem
                  </Button>
                </div>
              </form>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={group.mustChangePassword ? "warning" : "success"}>
                    {group.mustChangePassword ? "Skal skifte kode" : "Kode OK"}
                  </Badge>
                  <Badge tone="neutral">{group._count.taskContents} opgaver</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/gruppe/${group.id}`}>
                    <Button type="button">Se indhold</Button>
                  </Link>
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
    </AdminShell>
  );
}
