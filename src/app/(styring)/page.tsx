import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Card, Button } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <header className="staff-header px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Logo variant="brand" size={88} />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">SKS-løb</p>
            <h1 className="text-3xl font-bold">QR-poster</h1>
            <p className="mt-1 opacity-90">Opgaveposter til lejrgrupper</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Card className="text-center">
          <h2 className="mb-2 text-lg font-semibold">Log ind</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Admin og ledere bruger samme login-side. Deltagere åbner opgaver via QR-link.
          </p>
          <Link href="/login">
            <Button type="button">Gå til login →</Button>
          </Link>
        </Card>
      </div>
    </>
  );
}
