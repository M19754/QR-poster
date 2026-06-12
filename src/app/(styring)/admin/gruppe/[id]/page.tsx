import Link from "next/link";
import { notFound } from "next/navigation";
import { adminLogout } from "@/lib/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma, getActiveCamp } from "@/lib/db";
import { requireAdminReady } from "@/lib/admin-guard";
import { Badge, Button, Card } from "@/components/ui";

export default async function AdminGroupViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminReady();

  const { id } = await params;
  const camp = await getActiveCamp();
  if (!camp) notFound();

  const group = await prisma.group.findFirst({
    where: { id, campId: camp.id },
    include: {
      taskContents: {
        include: {
          task: { select: { id: true, title: true, sortOrder: true, active: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!group) notFound();

  const tasks = group.taskContents
    .map((tc) => ({
      ...tc.task,
      visibleToParticipants: tc.visibleToParticipants,
      itemCount: tc._count.items,
      updatedAt: tc.updatedAt,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <AdminShell
      title={group.name}
      subtitle={`${group.username} · ${camp.name}`}
      actions={
        <>
          <Link href="/admin/grupper">
            <Button type="button" variant="secondary">
              ← Admin
            </Button>
          </Link>
          <form action={adminLogout}>
            <Button type="submit" variant="secondary">
              Log ud
            </Button>
          </form>
        </>
      }
    >
      <div className="grid gap-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="mb-1 flex flex-wrap gap-2">
                <Badge tone={task.visibleToParticipants ? "success" : "danger"}>
                  {task.visibleToParticipants ? "Synlig" : "Skjult"}
                </Badge>
                <Badge tone={task.itemCount > 0 ? "neutral" : "warning"}>
                  {task.itemCount > 0 ? `${task.itemCount} elementer` : "Tom"}
                </Badge>
                {!task.active ? <Badge tone="danger">Opgave inaktiv</Badge> : null}
              </div>
              <h2 className="text-lg font-semibold">{task.title}</h2>
            </div>
            <Link href={`/admin/gruppe/${group.id}/opgave/${task.id}`}>
              <Button type="button">Se indhold</Button>
            </Link>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
