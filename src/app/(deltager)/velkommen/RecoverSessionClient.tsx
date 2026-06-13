"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";

export function RecoverSessionClient() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRecover() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bind", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ukendt fejl.");
        return;
      }
      localStorage.setItem("ps_id", data.sessionId);
      localStorage.setItem("ps_code", data.shortCode);
      setSuccess(`Gendannet: ${data.groupName}${data.holdName ? ` / ${data.holdName}` : ""}`);
    } catch {
      setError("Noget gik galt.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="text-center">
        <p className="mb-2 font-semibold text-[var(--success, #16a34a)]">{success}</p>
        <p className="text-sm text-[var(--muted)]">
          Din session er gendannet. Scan en opgave-QR-kode for at komme i gang.
        </p>
      </Card>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-[var(--muted)] underline underline-offset-2"
        >
          Har du en genvejskode?
        </button>
      </div>
    );
  }

  return (
    <Card>
      <p className="mb-3 text-sm font-semibold">Gendan med kode</p>
      <div className="mb-3">
        <Input
          placeholder="ABC-XYZ"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={7}
          className="text-center font-mono text-lg tracking-widest"
        />
      </div>
      {error ? <p className="mb-2 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={loading || code.length < 6}
          onClick={handleRecover}
          className="flex-1"
        >
          {loading ? "…" : "Gendan"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Annuller
        </Button>
      </div>
    </Card>
  );
}
