import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLeaderGroupId } from "@/lib/session";
import { StaffPageShell } from "@/components/layouts/StaffLayout";
import { Badge, Button, Card } from "@/components/ui";
import { leaderLogout } from "@/lib/actions/leader";

export default async function DashboardPage() {
  const groupId = await getLeaderGroupId();
  if (!groupId) redirect("/login");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      camp: true,
      taskContents: {
        include: {
          task: true,
          items: true,
        },
      },
    },
  });

  if (!group) redirect("/login");
  if (group.mustChangePassword) redirect("/skift-kode");

  const tasks = group.taskContents
    .map((tc) => ({
      ...tc.task,
      visibleToParticipants: tc.visibleToParticipants,
      itemCount: tc.items.length,
      updatedAt: tc.updatedAt,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <StaffPageShell
      title="Leder-dashboard"
      subtitle={`${group.name} · ${group.camp.name}`}
      actions={
        <form action={leaderLogout}>
          <Button type="submit" variant="secondary">
            Log ud
          </Button>
        </form>
      }
    >
      <div className="grid gap-3">
        {tasks.map((task) => (
          <Card key={task.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex flex-wrap gap-2">
                <Badge tone={task.visibleToParticipants ? "success" : "danger"}>
                  {task.visibleToParticipants ? "Synlig" : "Skjult"}
                </Badge>
                <Badge tone={task.itemCount > 0 ? "neutral" : "warning"}>
                  {task.itemCount > 0 ? `${task.itemCount} elementer` : "Tom"}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold">{task.title}</h2>
            </div>
            <Link href={`/dashboard/opgave/${task.id}`}>
              <Button type="button">Redigér</Button>
            </Link>
          </Card>
        ))}
      </div>
    </StaffPageShell>
  );
}
