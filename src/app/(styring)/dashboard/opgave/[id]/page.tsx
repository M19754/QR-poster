import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/session";
import { LeaderTaskForm } from "@/components/LeaderTaskForm";
import { StaffPageShell } from "@/components/layouts/StaffLayout";
import { Button } from "@/components/ui";

export default async function LeaderTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getStaffSession();
  if (!session || session.loginType !== "gruppe") redirect("/login");

  const groupId = session.groupId;

  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) redirect("/login");
  if (group.mustChangePassword) redirect("/skift-kode");

  const taskContent = await prisma.taskContent.findUnique({
    where: { taskId_groupId: { taskId: id, groupId } },
    include: { task: true, items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!taskContent) notFound();

  return (
    <StaffPageShell
      title={taskContent.task.title}
      subtitle={`Redigér indhold for ${group.name}`}
      actions={
        <Link href="/dashboard">
          <Button variant="secondary" type="button">
            ← Tilbage
          </Button>
        </Link>
      }
    >
      <LeaderTaskForm
        task={taskContent.task}
        visibleToParticipants={taskContent.visibleToParticipants}
        isCheckPost={taskContent.isCheckPost}
        checkPostText={taskContent.checkPostText}
        items={taskContent.items}
      />
    </StaffPageShell>
  );
}
