"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/forside", label: "Forside" },
  { href: "/admin/grupper", label: "Grupper" },
  { href: "/admin/opgaver", label: "Opgaver" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href === "/admin/grupper" && pathname.startsWith("/admin/gruppe/"));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--card)] text-[var(--text)] border border-[var(--border)] hover:opacity-90"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
