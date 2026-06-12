import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/** Layout til deltagere — mobil først, let og enkelt. */
export function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-participant min-h-screen">
      <header className="participant-header px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-3">
          <Logo variant="brand" size={44} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">SKS-løb</p>
            <p className="text-sm font-medium opacity-80">Opgave</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 pb-8 pt-2">{children}</main>
    </div>
  );
}
