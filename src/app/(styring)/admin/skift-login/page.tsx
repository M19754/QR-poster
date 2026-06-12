import { redirect } from "next/navigation";
import { changeAdminCredentials } from "@/lib/actions/admin";
import { ensureAdminSettings } from "@/lib/admin-settings";
import { getLoginType, isAdminAuthenticated } from "@/lib/session";
import { StaffAuthShell } from "@/components/layouts/StaffAuthShell";
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
  if (!(await isAdminAuthenticated()) || (await getLoginType()) !== "admin") {
    redirect("/login");
  }

  const settings = await ensureAdminSettings();
  if (!settings.mustChangeCredentials) redirect("/admin/forside");

  const { error } = await searchParams;

  return (
    <StaffAuthShell
      title="Skift admin-login"
      subtitle="Ved første login skal du vælge nyt brugernavn og adgangskode."
    >
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
    </StaffAuthShell>
  );
}
