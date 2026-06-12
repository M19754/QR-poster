import Link from "next/link";
import { leaderLogin } from "@/lib/actions/leader";
import { LoginForm } from "@/components/LoginForm";
import { LeaderAuthShell } from "@/components/layouts/StaffLayout";
import { Card } from "@/components/ui";

export default function LoginPage() {
  return (
    <LeaderAuthShell title="Leder-login" subtitle="Log ind med dit gruppe-login">
      <Card className="w-full max-w-md border-[var(--border)]">
        <LoginForm action={leaderLogin} usernamePlaceholder="Fx Grp. 1" />
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          <Link href="/">← Tilbage til forsiden</Link>
        </p>
      </Card>
    </LeaderAuthShell>
  );
}
