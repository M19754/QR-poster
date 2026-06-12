import { redirect } from "next/navigation";
import { changeLeaderPassword } from "@/lib/actions/leader";
import { prisma } from "@/lib/db";
import { getLeaderGroupId } from "@/lib/session";
import { PasswordForm } from "@/components/PasswordForm";
import { LeaderAuthShell } from "@/components/layouts/StaffLayout";
import { Alert, Card } from "@/components/ui";

export default async function ChangePasswordPage() {
  const groupId = await getLeaderGroupId();
  if (!groupId) redirect("/login");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) redirect("/login");
  if (!group.mustChangePassword) redirect("/dashboard");

  return (
    <LeaderAuthShell
      title="Skift kode"
      subtitle={`Du skal skifte kode for ${group.name} ved første login.`}
    >
      <Card className="w-full max-w-md border-[var(--border)]">
        <Alert variant="info">
          Af sikkerhedshensyn skal du vælge en ny kode, før du kan redigere opgaver.
        </Alert>
        <div className="mt-4">
          <PasswordForm action={changeLeaderPassword} />
        </div>
      </Card>
    </LeaderAuthShell>
  );
}
