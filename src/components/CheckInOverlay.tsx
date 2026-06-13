"use client";

import { useEffect, useState } from "react";

type Props = {
  taskId: string;
  taskTitle: string;
  defaultText: string;
};

export function CheckInOverlay({ taskId, taskTitle, defaultText }: Props) {
  const [visible, setVisible] = useState(true);
  const [text, setText] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    })
      .then((r) => r.json())
      .then((d: { confirmationText?: string; checkedAt?: string }) => {
        setText(d.confirmationText ?? defaultText);
        if (d.checkedAt) {
          setCheckedAt(
            new Date(d.checkedAt).toLocaleTimeString("da-DK", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      })
      .catch(() => setText(defaultText));
  }, [taskId, defaultText]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setVisible(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--card)] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-6xl">✓</div>
        <h2 className="mb-1 text-lg font-bold">{taskTitle}</h2>
        <p className="mb-6 whitespace-pre-wrap text-[var(--text)]">
          {text ?? defaultText}
        </p>
        {checkedAt && (
          <p className="mb-4 text-xs text-[var(--muted)]">Kl. {checkedAt}</p>
        )}
        <button
          onClick={() => setVisible(false)}
          className="rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
        >
          Se opgaven
        </button>
      </div>
    </div>
  );
}
