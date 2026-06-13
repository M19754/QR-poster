"use client";

import Link from "next/link";
import type { ParticipantItemView } from "@/lib/participant";
import { ContentDisplay } from "@/components/ContentDisplay";
import { CheckInOverlay } from "@/components/CheckInOverlay";
import { Card } from "@/components/ui";

type Props = {
  taskId: string;
  taskTitle: string;
  campName: string;
  groupName: string;
  holdName: string | null;
  entries: ParticipantItemView[];
  isVisible: boolean;
  isCheckPost: boolean;
  checkPostText: string | null;
  alreadyCheckedIn: boolean;
  showCheckPostOverview: boolean;
};

export function TaskView({
  taskId,
  taskTitle,
  campName,
  groupName,
  holdName,
  entries,
  isVisible,
  isCheckPost,
  checkPostText,
  alreadyCheckedIn,
  showCheckPostOverview,
}: Props) {
  return (
    <div className="space-y-4">
      {isCheckPost && !alreadyCheckedIn && (
        <CheckInOverlay
          taskId={taskId}
          taskTitle={taskTitle}
          defaultText={checkPostText ?? "Du har nu tjekket denne post af!"}
        />
      )}

      <Card>
        <div className="mb-4">
          <p className="text-xs text-[var(--muted)]">{campName}</p>
          <p className="text-sm text-[var(--muted)]">
            {groupName}
            {holdName ? ` · ${holdName}` : ""}
          </p>
          <h2 className="text-xl font-bold">{taskTitle}</h2>
          {isCheckPost && alreadyCheckedIn && (
            <span className="mt-1 inline-block rounded-full bg-[var(--success,#16a34a)] px-2 py-0.5 text-xs font-semibold text-white">
              ✓ Tjekket af
            </span>
          )}
        </div>

        {!isVisible ? (
          <p className="text-center text-[var(--muted)]">
            Denne opgave er ikke tilgængelig lige nu.
          </p>
        ) : entries.length === 0 ? (
          <p className="text-center text-[var(--muted)]">Ingen indhold endnu.</p>
        ) : (
          <ContentDisplay entries={entries} />
        )}
      </Card>

      {showCheckPostOverview && (
        <div className="text-center">
          <Link
            href="/oversigt"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:opacity-80"
          >
            <span>☑</span> Se vores tjek-post oversigt
          </Link>
        </div>
      )}
    </div>
  );
}
