import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Fælles login-layout (lys admin-stil). */
export function StaffAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <Logo variant="brand" size={96} />
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/">← Tilbage til forsiden</Link>
      </p>
    </div>
  );
}
