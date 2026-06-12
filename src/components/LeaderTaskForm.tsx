"use client";

import { useState } from "react";
import type { ContentItem, Task } from "@prisma/client";
import { saveTaskContent } from "@/lib/actions/leader";
import { getAcceptForType, getTypeLabel, type ContentFileType } from "@/lib/files";
import {
  formatDanishDateTime,
  getItemVisibilityStatus,
} from "@/lib/visibility";
import { Alert, Badge, Button, Card, Input, Label, Textarea } from "@/components/ui";

type ItemType = "text" | ContentFileType;

type ItemDraft = {
  id?: string;
  type: ItemType;
  body: string;
  fileUrl?: string | null;
  fileName?: string | null;
  useSchedule: boolean;
  showOpenTimeToParticipants: boolean;
  fromDate: string;
  fromTime: string;
  untilDate: string;
  untilTime: string;
};

function toDraft(item?: ContentItem): ItemDraft {
  const from = item?.visibleFrom ?? null;
  const until = item?.visibleUntil ?? null;
  return {
    id: item?.id,
    type: (item?.type as ItemType) ?? "text",
    body: item?.body ?? "",
    fileUrl: item?.fileUrl,
    fileName: item?.fileName,
    useSchedule: item?.useSchedule ?? false,
    showOpenTimeToParticipants: item?.showOpenTimeToParticipants ?? true,
    fromDate: from ? formatInputDate(from) : "",
    fromTime: from ? formatInputTime(from) : "",
    untilDate: until ? formatInputDate(until) : "",
    untilTime: until ? formatInputTime(until) : "",
  };
}

function formatInputDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatInputTime(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function statusBadge(item: ItemDraft) {
  const status = getItemVisibilityStatus({
    useSchedule: item.useSchedule,
    visibleFrom: item.fromDate && item.fromTime
      ? new Date(`${item.fromDate}T${item.fromTime}:00`)
      : null,
    visibleUntil: item.untilDate && item.untilTime
      ? new Date(`${item.untilDate}T${item.untilTime}:00`)
      : null,
  });

  if (status === "always") return <Badge>Altid synlig</Badge>;
  if (status === "scheduled") {
    return (
      <Badge tone="warning">
        {item.showOpenTimeToParticipants ? "Skjult (viser åbningstid)" : "Skjult (planlagt)"}
      </Badge>
    );
  }
  if (status === "expired") return <Badge tone="danger">Udløbet</Badge>;
  return <Badge tone="success">Åben nu</Badge>;
}

function ScheduleFields({
  draft,
  index,
  updateDraft,
}: {
  draft: ItemDraft;
  index: number;
  updateDraft: (index: number, patch: Partial<ItemDraft>) => void;
}) {
  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-4">
      <label className="mb-3 flex items-center gap-3">
        <input
          type="checkbox"
          checked={draft.useSchedule}
          onChange={(e) => updateDraft(index, { useSchedule: e.target.checked })}
          className="h-5 w-5"
        />
        <span className="text-sm font-medium">Tidsstyret synlighed</span>
      </label>

      {draft.useSchedule ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Synlig fra (dato)</Label>
              <Input
                type="date"
                value={draft.fromDate}
                onChange={(e) => updateDraft(index, { fromDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Synlig fra (tid)</Label>
              <Input
                type="time"
                value={draft.fromTime}
                onChange={(e) => updateDraft(index, { fromTime: e.target.value })}
              />
            </div>
            <div>
              <Label>Synlig til (dato)</Label>
              <Input
                type="date"
                value={draft.untilDate}
                onChange={(e) => updateDraft(index, { untilDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Synlig til (tid)</Label>
              <Input
                type="time"
                value={draft.untilTime}
                onChange={(e) => updateDraft(index, { untilTime: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.showOpenTimeToParticipants}
              onChange={(e) =>
                updateDraft(index, { showOpenTimeToParticipants: e.target.checked })
              }
              className="h-5 w-5"
            />
            <span className="text-sm">
              Vis åbningstidspunkt for deltagere (før indholdet åbner)
            </span>
          </label>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          Vises altid, når opgaven er synlig.
        </p>
      )}

      {draft.useSchedule && draft.fromDate ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Plan: {formatDanishDateTime(new Date(`${draft.fromDate}T${draft.fromTime || "00:00"}:00`))}
          {" — "}
          {draft.untilDate
            ? formatDanishDateTime(new Date(`${draft.untilDate}T${draft.untilTime || "23:59"}:00`))
            : "ingen slut"}
        </p>
      ) : null}
    </div>
  );
}

export function LeaderTaskForm({
  task,
  visibleToParticipants,
  items,
}: {
  task: Task;
  visibleToParticipants: boolean;
  items: ContentItem[];
}) {
  const [drafts, setDrafts] = useState<ItemDraft[]>(
    items.length > 0 ? items.map(toDraft) : [toDraft()]
  );
  const [visible, setVisible] = useState(visibleToParticipants);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateDraft(index: number, patch: Partial<ItemDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addItem(type: ItemType) {
    setDrafts((prev) => [...prev, { ...toDraft(), type }]);
  }

  function removeItem(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setMessage(null);
        formData.set("taskId", task.id);
        formData.set("visible", visible ? "on" : "");
        formData.set("itemCount", String(drafts.length));

        drafts.forEach((draft, index) => {
          if (draft.id) formData.set(`item_${index}_id`, draft.id);
          formData.set(`item_${index}_type`, draft.type);
          formData.set(`item_${index}_body`, draft.body);
          if (draft.fileUrl) formData.set(`item_${index}_fileUrl`, draft.fileUrl);
          if (draft.fileName) formData.set(`item_${index}_fileName`, draft.fileName);
          if (draft.useSchedule) formData.set(`item_${index}_useSchedule`, "on");
          if (draft.showOpenTimeToParticipants) {
            formData.set(`item_${index}_showOpenTime`, "on");
          }
          formData.set(`item_${index}_fromDate`, draft.fromDate);
          formData.set(`item_${index}_fromTime`, draft.fromTime);
          formData.set(`item_${index}_untilDate`, draft.untilDate);
          formData.set(`item_${index}_untilTime`, draft.untilTime);
        });

        const result = await saveTaskContent(formData);
        if (result?.error) setMessage(result.error);
        else setMessage("Opgaven er gemt.");
        setPending(false);
      }}
      className="space-y-4"
    >
      <Card>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-5 w-5"
          />
          <span className="font-medium">Synlig for deltagere</span>
        </label>
      </Card>

      {drafts.map((draft, index) => (
        <Card key={draft.id ?? `new-${index}`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-semibold">
              {getTypeLabel(draft.type)} #{index + 1}
            </h3>
            {statusBadge(draft)}
          </div>

          {draft.type === "text" ? (
            <div className="mb-4">
              <Label>Tekst</Label>
              <Textarea
                value={draft.body}
                onChange={(e) => updateDraft(index, { body: e.target.value })}
              />
            </div>
          ) : (
            <div className="mb-4 space-y-3">
              {draft.fileUrl ? (
                <div className="text-sm text-[var(--muted)]">
                  Nuværende fil: {draft.fileName ?? draft.fileUrl}
                </div>
              ) : null}
              <div>
                <Label>Upload {getTypeLabel(draft.type).toLowerCase()}</Label>
                <Input
                  type="file"
                  name={`item_${index}_file`}
                  accept={getAcceptForType(draft.type)}
                />
              </div>
              <div>
                <Label>Tekst (valgfri)</Label>
                <Textarea
                  value={draft.body}
                  onChange={(e) => updateDraft(index, { body: e.target.value })}
                />
              </div>
            </div>
          )}

          <ScheduleFields draft={draft} index={index} updateDraft={updateDraft} />

          {drafts.length > 1 ? (
            <div className="mt-4">
              <Button type="button" variant="danger" onClick={() => removeItem(index)}>
                Fjern element
              </Button>
            </div>
          ) : null}
        </Card>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => addItem("text")}>
          + Tekst
        </Button>
        <Button type="button" variant="secondary" onClick={() => addItem("image")}>
          + Billede
        </Button>
        <Button type="button" variant="secondary" onClick={() => addItem("pdf")}>
          + PDF
        </Button>
        <Button type="button" variant="secondary" onClick={() => addItem("audio")}>
          + Lyd
        </Button>
        <Button type="button" variant="secondary" onClick={() => addItem("video")}>
          + Video
        </Button>
      </div>

      {message ? (
        <Alert variant={message.includes("gemt") ? "success" : "error"}>{message}</Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Gemmer…" : "Gem opgave"}
      </Button>
    </form>
  );
}
