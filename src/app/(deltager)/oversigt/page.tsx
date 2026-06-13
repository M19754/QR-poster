import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma, getActiveCamp } from "@/lib/db";
import { getParticipantSession } from "@/lib/participant-session";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatTime(date: Date) {
  return date.toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OversightPage() {
  const session = await getParticipantSession();
  if (!session) redirect("/velkommen");

  const camp = await getActiveCamp();
  if (!camp || session.campId !== camp.id) redirect("/velkommen");

  if (!session.group.showCheckPostOverview) redirect("/velkommen");

  // Alle tjek-poster for gruppen
  const taskContents = await prisma.taskContent.findMany({
    where: { groupId: session.groupId, isCheckPost: true },
    include: { task: { select: { id: true, title: true, sortOrder: true } } },
    orderBy: { task: { sortOrder: "asc" } },
  });

  // Check-ins for dette hold/gruppe
  const checkIns = await prisma.taskCheckIn.findMany({
    where: {
      groupId: session.groupId,
      taskId: { in: taskContents.map((tc) => tc.taskId) },
      holdId: session.holdId ?? null,
    },
  });

  const checkedMap = new Map(checkIns.map((ci) => [ci.taskId, ci.checkedAt]));

  const done = taskContents.filter((tc) => checkedMap.has(tc.taskId));
  const remaining = taskContents.filter((tc) => !checkedMap.has(tc.taskId));

  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-1 text-xs text-[var(--muted)]">{camp.name}</p>
        <h1 className="text-xl font-bold">{session.group.name}</h1>
        {session.hold && (
          <p className="text-sm text-[var(--muted)]">Hold: {session.hold.name}</p>
        )}
        <div className="mt-3 flex gap-4 text-sm">
          <span className="font-semibold text-[var(--success,#16a34a)]">
            ✓ {done.length} afkrydset
          </span>
          <span className="text-[var(--muted)]">
            {remaining.length} tilbage
          </span>
        </div>

        {taskContents.length > 0 && (
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--success,#16a34a)] transition-all"
              style={{ width: `${Math.round((done.length / taskContents.length) * 100)}%` }}
            />
          </div>
        )}
      </Card>

      {taskContents.length === 0 ? (
        <Card>
          <p className="text-center text-[var(--muted)]">
            Der er ingen tjek-poster i denne lejr endnu.
          </p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {taskContents.map((tc) => {
            const checkedAt = checkedMap.get(tc.taskId);
            return (
              <div
                key={tc.taskId}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  checkedAt
                    ? "border-[var(--success,#16a34a)] bg-[color-mix(in_srgb,var(--success,#16a34a)_8%,transparent)]"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    checkedAt
                      ? "bg-[var(--success,#16a34a)] text-white"
                      : "bg-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {checkedAt ? "✓" : "–"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{tc.task.title}</p>
                  {checkedAt && (
                    <p className="text-xs text-[var(--muted)]">
                      {formatTime(checkedAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 text-center">
        <Link
          href="/"
          className="text-xs text-[var(--muted)] underline underline-offset-2"
        >
          ← Tilbage
        </Link>
      </div>
    </div>
  );
}
