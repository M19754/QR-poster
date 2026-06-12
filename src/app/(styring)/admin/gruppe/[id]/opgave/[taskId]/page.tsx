import Link from "next/link";
import { notFound } from "next/navigation";
import { adminLogout } from "@/lib/actions/admin";
import { AdminContentPreview } from "@/components/admin/AdminContentPreview";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma, getActiveCamp } from "@/lib/db";
import { requireAdminReady } from "@/lib/admin-guard";
import { Button } from "@/components/ui";

export default async function AdminGroupTaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  await requireAdminReady();

  const { id, taskId } = await params;
  const camp = await getActiveCamp();
  if (!camp) notFound();

  const group = await prisma.group.findFirst({
    where: { id, campId: camp.id },
    select: { id: true, name: true },
  });
  if (!group) notFound();

  const taskContent = await prisma.taskContent.findUnique({
    where: { taskId_groupId: { taskId, groupId: id } },
    include: {
      task: { select: { title: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!taskContent) notFound();

  return (
    <AdminShell
      title={taskContent.task.title}
      subtitle={`${group.name} — admin-visning`}
      actions={
        <>
          <Link href={`/admin/gruppe/${group.id}`}>
            <Button type="button" variant="secondary">
              ← Gruppe
            </Button>
          </Link>
          <Link href="/admin/forside">
            <Button type="button" variant="secondary">
              Admin
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
      <AdminContentPreview
        items={taskContent.items}
        visibleToParticipants={taskContent.visibleToParticipants}
      />
    </AdminShell>
  );
}
