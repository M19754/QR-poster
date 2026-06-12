import type { ContentItem } from "@prisma/client";
import type { ParticipantItemView } from "@/lib/participant";
import { getMediaSrc } from "@/lib/blob-access";
import { getTypeLabel } from "@/lib/files";
import { formatDanishDateTime } from "@/lib/visibility";

export function ContentDisplay({ entries }: { entries: ParticipantItemView[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-[var(--muted)]">
        Der er ikke noget tilgængeligt på denne opgave lige nu.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.item.id}
          className="rounded-2xl border border-[var(--border)] p-4"
        >
          {entry.kind === "scheduled" ? (
            <ScheduledItemView opensAt={entry.opensAt} item={entry.item} />
          ) : (
            <ContentItemView item={entry.item} />
          )}
        </div>
      ))}
    </div>
  );
}

function ScheduledItemView({
  opensAt,
  item,
}: {
  opensAt: Date;
  item: ContentItem;
}) {
  const label =
    item.type === "text"
      ? "Tekst"
      : item.fileName ?? getTypeLabel(item.type);

  return (
    <div className="text-center">
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-base font-semibold">
        Åbner {formatDanishDateTime(opensAt)}
      </p>
    </div>
  );
}

function ContentItemView({ item }: { item: ContentItem }) {
  const mediaSrc = item.fileUrl ? getMediaSrc(item.fileUrl) : null;

  if (item.type === "text" && item.body) {
    return <p className="whitespace-pre-wrap text-base leading-relaxed">{item.body}</p>;
  }

  if (item.type === "image" && mediaSrc) {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaSrc}
          alt={item.fileName ?? "Billede"}
          className="max-h-[70vh] w-full rounded-xl object-contain"
        />
        {item.body ? <p className="mt-3 whitespace-pre-wrap">{item.body}</p> : null}
      </div>
    );
  }

  if (item.type === "pdf" && mediaSrc) {
    return (
      <div>
        {item.body ? <p className="mb-3 whitespace-pre-wrap text-sm">{item.body}</p> : null}
        <p className="mb-2 font-medium">{item.fileName ?? "PDF"}</p>
        <iframe
          src={mediaSrc}
          title={item.fileName ?? "PDF"}
          className="h-[60vh] w-full rounded-xl border border-[var(--border)]"
        />
        <a
          href={mediaSrc}
          className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white"
          target="_blank"
          rel="noreferrer"
        >
          Åbn PDF i fuld skærm
        </a>
      </div>
    );
  }

  if (item.type === "audio" && mediaSrc) {
    return (
      <div>
        <p className="mb-2 font-medium">{item.fileName ?? "Lyd"}</p>
        {item.body ? <p className="mb-3 whitespace-pre-wrap text-sm">{item.body}</p> : null}
        <audio controls className="w-full" src={mediaSrc}>
          Din browser understøtter ikke lydafspilning.
        </audio>
      </div>
    );
  }

  if (item.type === "video" && mediaSrc) {
    return (
      <div>
        {item.body ? <p className="mb-3 whitespace-pre-wrap text-sm">{item.body}</p> : null}
        <video
          controls
          playsInline
          className="max-h-[60vh] w-full rounded-xl"
          src={mediaSrc}
        >
          Din browser understøtter ikke videoafspilning.
        </video>
      </div>
    );
  }

  if (mediaSrc) {
    return (
      <div>
        <p className="mb-2 font-medium">{item.fileName ?? "Fil"}</p>
        {item.body ? <p className="mb-3 whitespace-pre-wrap text-sm">{item.body}</p> : null}
        <a
          href={mediaSrc}
          className="inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white"
          target="_blank"
          rel="noreferrer"
        >
          Åbn fil
        </a>
      </div>
    );
  }

  return null;
}
