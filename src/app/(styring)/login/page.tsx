import Link from "next/link";
import { staffLogin } from "@/lib/actions/staff";
import { LeaderAuthShell } from "@/components/layouts/StaffLayout";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <LeaderAuthShell
      title="Log ind"
      subtitle="Admin eller leder — samme login-side"
    >
      <Card className="w-full max-w-md border-[var(--border)]">
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
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          <Link href="/">← Tilbage til forsiden</Link>
        </p>
      </Card>
    </LeaderAuthShell>
  );
}
