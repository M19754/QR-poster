"use client";

import { useState } from "react";
import { Alert, Button, Label } from "@/components/ui";

export function ImportCampForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        try {
          await action(formData);
        } catch {
          setError("Import fejlede. Tjek filformatet og prøv igen.");
          setPending(false);
        }
      }}
      className="space-y-4"
    >
      <div>
        <Label>Vælg fil (CSV eller JSON)</Label>
        <input
          type="file"
          name="file"
          accept=".csv,.json,text/csv,application/json"
          required
          className="mt-1 block w-full text-sm"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="replace" className="h-4 w-4" />
          Erstat alle eksisterende grupper og opgaver (sletter indhold)
        </label>
      </div>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Importerer…" : "Importér grupper og opgaver"}
      </Button>
    </form>
  );
}
