import type { ContentItem } from "@prisma/client";
import { getMediaSrc } from "@/lib/blob-access";
import { getTypeLabel } from "@/lib/files";
import { formatDanishDateTime } from "@/lib/visibility";
import { Badge } from "@/components/ui";

export function AdminContentPreview({
  items,
  visibleToParticipants,
}: {
  items: ContentItem[];
  visibleToParticipants: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge tone={visibleToParticipants ? "success" : "danger"}>
          Opgave {visibleToParticipants ? "synlig" : "skjult"} for deltagere
        </Badge>
        <Badge tone="neutral">{items.length} elementer</Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Gruppen har ikke lagt indhold op endnu.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--border)] p-4"
            >
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone="neutral">{getTypeLabel(item.type)}</Badge>
                {item.useSchedule ? (
                  <Badge tone="warning">
                    {formatDanishDateTime(item.visibleFrom)} –{" "}
                    {formatDanishDateTime(item.visibleUntil)}
                  </Badge>
                ) : null}
              </div>
              {item.type === "text" && item.body ? (
                <p className="whitespace-pre-wrap text-sm">{item.body}</p>
              ) : null}
              {item.fileUrl ? (
                <a
                  href={getMediaSrc(item.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--accent-dark)]"
                >
                  {item.fileName ?? "Åbn fil"} →
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
