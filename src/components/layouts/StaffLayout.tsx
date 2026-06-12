import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/** Ydre layout til leder og admin. */
export function StaffLayout({ children }: { children: ReactNode }) {
  return <div className="theme-staff min-h-screen">{children}</div>;
}

/** Indre skal til sider med orange header (admin, dashboard, forsiden). */
export function StaffPageShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <>
      <header className="staff-header px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Logo variant="brand" size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">SKS-løb</p>
            <p className="truncate text-lg font-bold">{title}</p>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {subtitle ? (
          <p className="mb-6 text-sm text-[var(--muted)]">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </>
  );
}

/** Fuldskærms-layout til leder-login (mørk, orange logo). */
export function LeaderAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="theme-leader flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <Logo variant="inverted" size={96} />
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
