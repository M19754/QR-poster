import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { StaffPageShell } from "@/components/layouts/StaffLayout";

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <StaffPageShell title={title} subtitle={subtitle} actions={actions}>
      <AdminNav />
      {children}
    </StaffPageShell>
  );
}
