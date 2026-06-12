"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert, Button, Input, Label } from "@/components/ui";

export type LoginState = { error?: string } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Logger ind…" : "Log ind"}
    </Button>
  );
}

export function LoginForm({
  action,
  usernamePlaceholder,
}: {
  action: (prevState: LoginState, formData: FormData) => Promise<LoginState>;
  usernamePlaceholder?: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
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
      {state?.error ? <Alert>{state.error}</Alert> : null}
      <SubmitButton />
    </form>
  );
}
