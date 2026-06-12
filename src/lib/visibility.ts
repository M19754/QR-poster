import type { ContentItem } from "@prisma/client";

const TIMEZONE = "Europe/Copenhagen";

export function nowInCopenhagen(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: TIMEZONE })
  );
}

export function isItemVisibleToParticipant(
  item: Pick<ContentItem, "useSchedule" | "visibleFrom" | "visibleUntil">,
  now: Date = nowInCopenhagen()
): boolean {
  if (!item.useSchedule) return true;
  if (item.visibleFrom && now < item.visibleFrom) return false;
  if (item.visibleUntil && now > item.visibleUntil) return false;
  return true;
}

export function getItemVisibilityStatus(
  item: Pick<ContentItem, "useSchedule" | "visibleFrom" | "visibleUntil">,
  now: Date = nowInCopenhagen()
): "always" | "open" | "scheduled" | "expired" {
  if (!item.useSchedule) return "always";
  if (item.visibleFrom && now < item.visibleFrom) return "scheduled";
  if (item.visibleUntil && now > item.visibleUntil) return "expired";
  return "open";
}

export function formatDanishDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("da-DK", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function parseDanishDateTimeInput(from: string, time: string): Date | null {
  if (!from || !time) return null;
  const [year, month, day] = from.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute, 0);
}
