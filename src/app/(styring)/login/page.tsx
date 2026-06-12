import { staffLogin } from "@/lib/actions/staff";
import { StaffAuthShell } from "@/components/layouts/StaffAuthShell";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <StaffAuthShell
      title="Log ind"
      subtitle="Admin eller gruppe — samme login"
    >
      <Card className="w-full max-w-md">
        <form action={staffLogin} className="space-y-4">
          <div>
            <Label>Brugernavn</Label>
            <Input
              name="username"
              placeholder="Admin eller fx Grp. 1"
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
          {error ? <Alert>Forkert brugernavn eller adgangskode.</Alert> : null}
          <Button type="submit" className="w-full">
            Log ind
          </Button>
        </form>
      </Card>
    </StaffAuthShell>
  );
}
