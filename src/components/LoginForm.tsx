"use client";

import { useState } from "react";
import { Alert, Button, Input, Label } from "@/components/ui";

export function LoginForm({
  action,
  usernamePlaceholder,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  usernamePlaceholder?: string;
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
        <Label>Brugernavn</Label>
        <Input
          name="username"
          placeholder={usernamePlaceholder}
          required
          autoComplete="username"
        />
      </div>
      <div>
        <Label>Adgangskode</Label>
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Logger ind…" : "Log ind"}
      </Button>
    </form>
  );
}
