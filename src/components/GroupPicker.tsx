"use client";

import type { Group } from "@prisma/client";

const STORAGE_KEY = "qr-poster-participant";

export type ParticipantSelection = {
  campId: string;
  epoch: number;
  groupId: string;
};

export function getStoredSelection(campId: string, epoch: number): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ParticipantSelection;
    if (data.campId === campId && data.epoch === epoch) {
      return data.groupId;
    }
    return null;
  } catch {
    return null;
  }
}

export function storeSelection(campId: string, epoch: number, groupId: string) {
  const data: ParticipantSelection = { campId, epoch, groupId };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearSelection() {
  localStorage.removeItem(STORAGE_KEY);
}

export function GroupPicker({
  groups,
  onSelect,
}: {
  groups: Pick<Group, "id" | "name">[];
  onSelect: (groupId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-center text-[var(--muted)]">Vælg din gruppe for at se opgaven.</p>
      <div className="grid gap-3">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group.id)}
            className="min-h-14 rounded-2xl border-2 border-[var(--primary)] bg-white px-4 text-lg font-semibold text-[var(--primary)] transition hover:bg-blue-50 active:scale-[0.99]"
          >
            {group.name}
          </button>
        ))}
      </div>
    </div>
  );
}
