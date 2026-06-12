"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function QrCodeDisplay({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const qrSrc = `/api/qr?url=${encodeURIComponent(url)}`;
  const safeName = title.replace(/[^\w\s-æøåÆØÅ]/g, "").trim() || "opgave";

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Vis QR-kode
      </Button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-slate-50 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt={`QR-kode for ${title}`}
        className="mx-auto h-48 w-48 rounded-lg bg-white p-2"
      />
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <a href={qrSrc} download={`qr-${safeName}.png`}>
          <Button type="button" variant="accent">
            Download QR
          </Button>
        </a>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Skjul
        </Button>
      </div>
    </div>
  );
}
