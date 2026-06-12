import type { ContentItem, Task, TaskContent } from "@prisma/client";
import {
  getItemVisibilityStatus,
  isItemVisibleToParticipant,
  nowInCopenhagen,
} from "@/lib/visibility";

export type ParticipantContent = {
  task: Task;
  items: ContentItem[];
  campEpoch: number;
};

export type ParticipantItemView =
  | { kind: "content"; item: ContentItem }
  | { kind: "scheduled"; item: ContentItem; opensAt: Date };

export function buildParticipantItems(items: ContentItem[]): ParticipantItemView[] {
  const now = nowInCopenhagen();

  return items
    .map((item): ParticipantItemView | null => {
      if (isItemVisibleToParticipant(item, now)) {
        return { kind: "content", item };
      }

      const status = getItemVisibilityStatus(item, now);
      if (
        status === "scheduled" &&
        item.showOpenTimeToParticipants &&
        item.visibleFrom
      ) {
        return { kind: "scheduled", item, opensAt: item.visibleFrom };
      }

      return null;
    })
    .filter((entry): entry is ParticipantItemView => entry !== null)
    .sort((a, b) => a.item.sortOrder - b.item.sortOrder);
}

/** @deprecated Brug buildParticipantItems */
export function filterVisibleItems(items: ContentItem[]) {
  const now = nowInCopenhagen();
  return items
    .filter((item) => isItemVisibleToParticipant(item, now))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function buildParticipantContent(
  task: Task,
  taskContent: TaskContent & { items: ContentItem[] },
  campEpoch: number
): ParticipantContent | null {
  if (!task.active || !taskContent.visibleToParticipants) return null;

  const items = buildParticipantItems(taskContent.items)
    .filter((entry) => entry.kind === "content")
    .map((entry) => entry.item);

  if (items.length === 0) return null;

  return { task, items, campEpoch };
}
