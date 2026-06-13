"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";

type Hold = { id: string; name: string };

type Props = {
  token: string;
  groupName: string;
  campName: string;
  holds: Hold[];
};

type BindResult = {
  sessionId: string;
  shortCode: string;
  groupName: string;
  holdName: string | null;
};

async function callBind(token: string, holdId?: string): Promise<BindResult> {
  const res = await fetch("/api/bind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, holdId: holdId ?? null }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Fejl ved tilknytning.");
  return data as BindResult;
}

export function BindClient({ token, groupName, campName, holds }: Props) {
  const [step, setStep] = useState<"loading" | "pick" | "done" | "error">(
    holds.length === 0 ? "loading" : "pick"
  );
  const [result, setResult] = useState<BindResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [binding, setBinding] = useState(false);

  // Automatisk binding hvis ingen hold
  useEffect(() => {
    if (holds.length === 0) {
      callBind(token)
        .then((r) => {
          localStorage.setItem("ps_id", r.sessionId);
          localStorage.setItem("ps_code", r.shortCode);
          setResult(r);
          setStep("done");
        })
        .catch((e) => {
          setErrorMsg(e.message);
          setStep("error");
        });
    }
  }, [token, holds.length]);

  async function handlePickHold(holdId: string) {
    setBinding(true);
    try {
      const r = await callBind(token, holdId);
      localStorage.setItem("ps_id", r.sessionId);
      localStorage.setItem("ps_code", r.shortCode);
      setResult(r);
      setStep("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Fejl.");
      setStep("error");
    } finally {
      setBinding(false);
    }
  }

  if (step === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <p className="text-[var(--muted)]">Tilknytter din enhed…</p>
        </Card>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <p className="mb-4 text-lg font-semibold text-[var(--danger)]">Fejl</p>
          <p className="mb-4 text-sm text-[var(--muted)]">{errorMsg}</p>
          <p className="text-xs text-[var(--muted)]">
            Prøv at scanne QR-koden igen, eller kontakt dine ledere.
          </p>
        </Card>
      </div>
    );
  }

  if (step === "pick") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <p className="mb-1 text-center text-xs text-[var(--muted)]">{campName}</p>
          <h1 className="mb-1 text-center text-xl font-bold">{groupName}</h1>
          <p className="mb-6 text-center text-sm text-[var(--muted)]">Vælg dit hold:</p>
          <div className="grid gap-2">
            {holds.map((h) => (
              <Button
                key={h.id}
                type="button"
                variant="secondary"
                disabled={binding}
                onClick={() => handlePickHold(h.id)}
                className="w-full text-base"
              >
                {h.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // done
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h1 className="mb-1 text-xl font-bold">Tilknyttet!</h1>
        <p className="mb-1 text-sm text-[var(--muted)]">{campName}</p>
        <p className="mb-1 font-semibold">{result?.groupName}</p>
        {result?.holdName ? (
          <p className="mb-4 text-sm text-[var(--muted)]">Hold: {result.holdName}</p>
        ) : (
          <div className="mb-4" />
        )}
        <div className="rounded-xl bg-[var(--bg)] p-3">
          <p className="mb-1 text-xs text-[var(--muted)]">Din genvejskode (ved tab af adgang):</p>
          <p className="font-mono text-2xl font-bold tracking-widest">{result?.shortCode}</p>
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Du kan nu scanne opgave-QR-koderne for at se opgaverne.
        </p>
      </Card>
    </div>
  );
}
