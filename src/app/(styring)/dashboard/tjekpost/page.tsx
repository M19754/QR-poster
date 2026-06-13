import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/session";
import { StaffPageShell } from "@/components/layouts/StaffLayout";
import { Button, Card } from "@/components/ui";

function formatTime(date: Date) {
  return date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
}

export default async function TjekpostPage() {
  const session = await getStaffSession();
  if (!session || session.loginType !== "gruppe") redirect("/login");

  const group = await prisma.group.findUnique({
    where: { id: session.groupId },
    include: {
      camp: true,
      holds: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!group) redirect("/login");
  if (group.mustChangePassword) redirect("/skift-kode");

  // Hent alle tjek-poster for gruppen
  const taskContents = await prisma.taskContent.findMany({
    where: { groupId: group.id, isCheckPost: true },
    include: { task: true },
    orderBy: { task: { sortOrder: "asc" } },
  });

  const taskIds = taskContents.map((tc) => tc.taskId);

  // Hent alle check-ins
  const checkIns = await prisma.taskCheckIn.findMany({
    where: { groupId: group.id, taskId: { in: taskIds } },
    orderBy: { checkedAt: "asc" },
  });

  const hasHolds = group.holds.length > 0;

  // Opbyg matrix: task → hold/gruppe → checkin
  const matrix: Record<string, Record<string, { checkedAt: Date } | undefined>> = {};
  for (const tc of taskContents) {
    matrix[tc.taskId] = {};
  }
  for (const ci of checkIns) {
    const key = ci.holdId ?? "gruppe";
    if (matrix[ci.taskId]) {
      matrix[ci.taskId][key] = { checkedAt: ci.checkedAt };
    }
  }

  const rows = hasHolds ? group.holds : [{ id: "gruppe", name: group.name }];

  return (
    <StaffPageShell
      title="Tjek-post overblik"
      subtitle={group.name}
      actions={
        <Link href="/dashboard">
          <Button variant="secondary" type="button">
            ← Tilbage
          </Button>
        </Link>
      }
    >
      {taskContents.length === 0 ? (
        <Card>
          <p className="text-center text-[var(--muted)]">
            Ingen tjek-poster er sat op endnu. Redigér en opgave og aktivér
            &quot;Tjek-post&quot; for at komme i gang.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 pr-4 text-left font-semibold text-[var(--muted)]">
                      {hasHolds ? "Hold" : "Gruppe"}
                    </th>
                    {taskContents.map((tc) => (
                      <th
                        key={tc.taskId}
                        className="px-2 py-2 text-center font-semibold"
                        title={tc.task.title}
                      >
                        <span className="block max-w-[80px] truncate">
                          {tc.task.title}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium">{row.name}</td>
                      {taskContents.map((tc) => {
                        const ci = matrix[tc.taskId]?.[row.id];
                        return (
                          <td key={tc.taskId} className="px-2 py-2 text-center">
                            {ci ? (
                              <span
                                className="font-semibold text-[var(--success,#16a34a)]"
                                title={ci.checkedAt.toLocaleString("da-DK")}
                              >
                                ✓ {formatTime(ci.checkedAt)}
                              </span>
                            ) : (
                              <span className="text-[var(--muted)]">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </StaffPageShell>
  );
}
