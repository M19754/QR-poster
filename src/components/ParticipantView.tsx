"use client";

import { useEffect, useState } from "react";
import type { Group, Task } from "@prisma/client";
import type { ParticipantItemView } from "@/lib/participant";
import { ContentDisplay } from "@/components/ContentDisplay";
import {
  GroupPicker,
  clearSelection,
  getStoredSelection,
  storeSelection,
} from "@/components/GroupPicker";
import { Button, Card } from "@/components/ui";

type Props = {
  task: Task;
  campId: string;
  campName: string;
  epoch: number;
  groups: Pick<Group, "id" | "name">[];
  contentByGroup: Record<string, ParticipantItemView[]>;
  visibilityByGroup: Record<string, boolean>;
};

export function ParticipantView({
  task,
  campId,
  campName,
  epoch,
  groups,
  contentByGroup,
  visibilityByGroup,
}: Props) {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGroupId(getStoredSelection(campId, epoch));
    setReady(true);
  }, [campId, epoch]);

  function handleSelect(id: string) {
    storeSelection(campId, epoch, id);
    setGroupId(id);
  }

  function handleChangeGroup() {
    clearSelection();
    setGroupId(null);
  }

  if (!ready) {
    return <p className="text-center text-[var(--muted)]">Indlæser…</p>;
  }

  if (!groupId) {
    return (
      <Card>
        <p className="mb-1 text-center text-xs text-[var(--muted)]">{campName}</p>
        <h2 className="mb-4 text-center text-xl font-bold">{task.title}</h2>
        <GroupPicker groups={groups} onSelect={handleSelect} />
      </Card>
    );
  }

  const entries = contentByGroup[groupId] ?? [];
  const isVisible = visibilityByGroup[groupId] ?? false;
  const groupName = groups.find((g) => g.id === groupId)?.name ?? "Din gruppe";

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--muted)]">{campName}</p>
            <p className="text-sm text-[var(--muted)]">{groupName}</p>
            <h2 className="text-xl font-bold">{task.title}</h2>
          </div>
        </div>

        {!isVisible ? (
          <p className="text-center text-[var(--muted)]">
            Denne opgave er ikke tilgængelig lige nu.
          </p>
        ) : (
          <ContentDisplay entries={entries} />
        )}
      </Card>

      <div className="text-center">
        <Button variant="secondary" type="button" onClick={handleChangeGroup}>
          Skift gruppe
        </Button>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Har du valgt forkert gruppe? Tryk her for at vælge igen.
        </p>
      </div>
    </div>
  );
}
