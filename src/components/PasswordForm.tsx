"use client";

import { useState } from "react";
import { Alert, Button, Input, Label } from "@/components/ui";

export function PasswordForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await action(formData);
        if (result?.error) setError(result.error);
        setPending(false);
      }}
      className="space-y-4"
    >
      <div>
        <Label>Ny kode</Label>
        <Input name="newPassword" type="password" required minLength={3} />
      </div>
      <div>
        <Label>Gentag ny kode</Label>
        <Input name="confirmPassword" type="password" required minLength={3} />
      </div>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Gemmer…" : "Gem ny kode"}
      </Button>
    </form>
  );
}
