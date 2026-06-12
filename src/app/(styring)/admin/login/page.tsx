import Link from "next/link";
import { adminLogin } from "@/lib/actions/admin";
import { Logo } from "@/components/Logo";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <Logo variant="brand" size={96} />
        </div>
        <h1 className="text-2xl font-bold">Admin-login</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Standard: 1234 / 1234 — skiftes ved første login
        </p>
      </div>

      <Card className="w-full max-w-md">
        <form action={adminLogin} className="space-y-4">
          <div>
            <Label>Brugernavn</Label>
            <Input
              name="username"
              placeholder="1234"
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
          {error ? (
            <Alert>Forkert brugernavn eller adgangskode.</Alert>
          ) : null}
          <Button type="submit" className="w-full">
            Log ind
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          <Link href="/">← Tilbage til forsiden</Link>
        </p>
      </Card>
    </div>
  );
}
