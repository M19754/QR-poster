import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui";

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Leder</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Log ind med dit gruppe-login og redigér opgaver.
            </p>
            <Link href="/login" className="font-semibold">
              Gå til leder-login →
            </Link>
          </Card>
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Admin</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Administrér grupper, opgaver og lejr-indstillinger.
            </p>
            <Link href="/admin/login" className="font-semibold">
              Gå til admin →
            </Link>
          </Card>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Deltagere åbner opgaver via QR-link — ikke fra denne side.
        </p>
      </div>
    </>
  );
}
