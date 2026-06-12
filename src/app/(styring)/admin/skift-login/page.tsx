import { redirect } from "next/navigation";
import { changeAdminCredentials } from "@/lib/actions/admin";
import { ensureAdminSettings } from "@/lib/admin-settings";
import { isAdminAuthenticated } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  username: "Brugernavn skal være mindst 2 tegn.",
  password: "Adgangskode skal være mindst 3 tegn.",
  mismatch: "Adgangskoderne matcher ikke.",
};

export default async function AdminChangeCredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const settings = await ensureAdminSettings();
  if (!settings.mustChangeCredentials) redirect("/admin");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <Logo variant="brand" size={96} />
        </div>
        <h1 className="text-2xl font-bold">Skift admin-login</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ved første login skal du vælge nyt brugernavn og adgangskode.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <Alert variant="info">
          Standard-login er 1234 / 1234. Vælg nu dine egne oplysninger.
        </Alert>
        <form action={changeAdminCredentials} className="mt-4 space-y-4">
          <div>
            <Label>Nyt brugernavn</Label>
            <Input name="username" required minLength={2} autoComplete="username" />
          </div>
          <div>
            <Label>Ny adgangskode</Label>
            <Input
              name="newPassword"
              type="password"
              required
              minLength={3}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Gentag adgangskode</Label>
            <Input
              name="confirmPassword"
              type="password"
              required
              minLength={3}
              autoComplete="new-password"
            />
          </div>
          {error && errorMessages[error] ? (
            <Alert>{errorMessages[error]}</Alert>
          ) : null}
          <Button type="submit" className="w-full">
            Gem og fortsæt
          </Button>
        </form>
      </Card>
    </div>
  );
}
