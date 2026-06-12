import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma, getActiveCamp } from "@/lib/db";
import { ensureAdminSettings } from "@/lib/admin-settings";
import { isAdminAuthenticated } from "@/lib/session";
import { getTaskPublicUrl } from "@/lib/urls";
import { PrintButton } from "@/components/PrintButton";
import { StaffPageShell } from "@/components/layouts/StaffLayout";
import { Button } from "@/components/ui";

export default async function QrPrintPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const adminSettings = await ensureAdminSettings();
  if (adminSettings.mustChangeCredentials) redirect("/admin/skift-login");

  const camp = await getActiveCamp();
  if (!camp) redirect("/admin");

  const tasks = await prisma.task.findMany({
    where: { campId: camp.id, active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <StaffPageShell
      title="QR-plakater"
      subtitle={`${camp.name} · ${tasks.length} opgaver`}
      actions={
        <Link href="/admin">
          <Button type="button" variant="secondary">
            ← Tilbage
          </Button>
        </Link>
      }
    >
      <div className="mb-6 print:hidden">
        <PrintButton />
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
        {tasks.map((task) => {
          const url = getTaskPublicUrl(task.id);
          const qrSrc = `/api/qr?url=${encodeURIComponent(url)}`;
          return (
            <div
              key={task.id}
              className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-white p-6 text-center print:break-inside-avoid"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`QR for ${task.title}`}
                className="h-40 w-40"
              />
              <h2 className="mt-4 text-lg font-bold">{task.title}</h2>
              <p className="mt-1 break-all text-xs text-[var(--muted)]">{url}</p>
            </div>
          );
        })}
      </div>
    </StaffPageShell>
  );
}
