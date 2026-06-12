import Link from "next/link";
import { adminLogin } from "@/lib/actions/admin";
import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <Logo variant="brand" size={96} />
        </div>
        <h1 className="text-2xl font-bold">Admin-login</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Fast administratorkonto</p>
      </div>

      <Card className="w-full max-w-md">
        <LoginForm action={adminLogin} />
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          <Link href="/">← Tilbage til forsiden</Link>
        </p>
      </Card>
    </div>
  );
}
