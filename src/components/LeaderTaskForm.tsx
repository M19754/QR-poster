"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContentItem, Task } from "@prisma/client";
import { saveTaskContent } from "@/lib/actions/leader";
import { getAcceptForType, getTypeLabel, MAX_FILE_BYTES, detectFileType, type ContentFileType } from "@/lib/files";
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
                name={`item_${index}_fromDate`}
                value={draft.fromDate}
                onChange={(e) => updateDraft(index, { fromDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Synlig fra (tid)</Label>
              <Input
                type="time"
                name={`item_${index}_fromTime`}
                value={draft.fromTime}
                onChange={(e) => updateDraft(index, { fromTime: e.target.value })}
              />
            </div>
            <div>
              <Label>Synlig til (dato)</Label>
              <Input
                type="date"
                name={`item_${index}_untilDate`}
                value={draft.untilDate}
                onChange={(e) => updateDraft(index, { untilDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Synlig til (tid)</Label>
              <Input
                type="time"
                name={`item_${index}_untilTime`}
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
          <input
            type="hidden"
            name={`item_${index}_showOpenTime`}
            value={draft.showOpenTimeToParticipants ? "on" : ""}
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          Vises altid, når opgaven er synlig.
        </p>
      )}

      <input
        type="hidden"
        name={`item_${index}_useSchedule`}
        value={draft.useSchedule ? "on" : ""}
      />

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
  const router = useRouter();
  const [drafts, setDrafts] = useState<ItemDraft[]>(
    items.length > 0 ? items.map(toDraft) : [toDraft()]
  );
  const [visible, setVisible] = useState(visibleToParticipants);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );
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

  async function uploadDraftFile(index: number, formData: FormData) {
    const file = formData.get(`item_${index}_file`);
    if (!(file instanceof File) || file.size === 0) return null;

    const detected = detectFileType(file.name);
    if (!detected) {
      throw new Error(`Filtypen understøttes ikke: ${file.name}`);
    }
    if (file.size > MAX_FILE_BYTES[detected]) {
      const maxMb = Math.round(MAX_FILE_BYTES[detected] / (1024 * 1024));
      throw new Error(`Filen er for stor (max ${maxMb} MB).`);
    }

    // Store filer (>4 MB): direkte til Blob via presigned URL (OIDC).
    if (file.size > 4 * 1024 * 1024) {
      const { uploadPresigned } = await import("@vercel/blob/client");
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const pathname = `upload-${Date.now()}-${index}${ext}`;
      const blob = await uploadPresigned(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      return {
        url: blob.url,
        fileName: file.name,
        type: detected,
      };
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: uploadData,
    });

    const payload = (await response.json()) as {
      url?: string;
      fileName?: string;
      type?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Kunne ikke uploade filen.");
    }

    return payload;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("taskId", task.id);
    formData.set("visible", visible ? "on" : "");
    formData.set("itemCount", String(drafts.length));

    try {
      for (let index = 0; index < drafts.length; index++) {
        const draft = drafts[index];
        formData.set(`item_${index}_type`, draft.type);
        if (draft.id) formData.set(`item_${index}_id`, draft.id);

        const uploaded = await uploadDraftFile(index, formData);
        if (uploaded?.url) {
          formData.set(`item_${index}_fileUrl`, uploaded.url);
          formData.set(`item_${index}_fileName`, uploaded.fileName ?? "");
          if (uploaded.type) formData.set(`item_${index}_type`, uploaded.type);
        } else {
          if (draft.fileUrl) formData.set(`item_${index}_fileUrl`, draft.fileUrl);
          if (draft.fileName) formData.set(`item_${index}_fileName`, draft.fileName);
        }

        formData.delete(`item_${index}_file`);
      }

      const result = await saveTaskContent(null, formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Opgaven er gemt." });
        router.refresh();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Kunne ikke gemme opgaven. Prøv igen.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <input type="hidden" name={`item_${index}_type`} value={draft.type} />
          {draft.id ? (
            <input type="hidden" name={`item_${index}_id`} value={draft.id} />
          ) : null}
          {draft.fileUrl ? (
            <input type="hidden" name={`item_${index}_fileUrl`} value={draft.fileUrl} />
          ) : null}
          {draft.fileName ? (
            <input type="hidden" name={`item_${index}_fileName`} value={draft.fileName} />
          ) : null}

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
                name={`item_${index}_body`}
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
                  name={`item_${index}_body`}
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
        <Alert variant={message.type === "success" ? "success" : "error"}>
          {message.text}
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Gemmer…" : "Gem opgave"}
      </Button>
    </form>
  );
}
