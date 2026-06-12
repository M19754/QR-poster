import { redirect } from "next/navigation";
import { changeLeaderPassword } from "@/lib/actions/leader";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/session";
import { PasswordForm } from "@/components/PasswordForm";
import { StaffAuthShell } from "@/components/layouts/StaffAuthShell";
import { Alert, Card } from "@/components/ui";

export default async function ChangePasswordPage() {
  const session = await getStaffSession();
  if (!session || session.loginType !== "gruppe") redirect("/login");

  const group = await prisma.group.findUnique({ where: { id: session.groupId } });
  if (!group) redirect("/login");
  if (!group.mustChangePassword) redirect("/dashboard");

  return (
    <StaffAuthShell
      title="Skift kode"
      subtitle={`Du skal skifte kode for ${group.name} ved første login.`}
    >
      <Card className="w-full max-w-md">
        <Alert variant="info">
          Af sikkerhedshensyn skal du vælge en ny kode, før du kan redigere opgaver.
        </Alert>
        <div className="mt-4">
          <PasswordForm action={changeLeaderPassword} />
        </div>
      </Card>
    </StaffAuthShell>
  );
}
