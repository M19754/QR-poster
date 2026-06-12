import { redirect } from "next/navigation";
import { ensureAdminSettings } from "@/lib/admin-settings";
import { isAdminAuthenticated } from "@/lib/session";

export async function requireAdminAuth() {
  if (!(await isAdminAuthenticated())) {
    redirect("/login");
  }
}

export async function requireAdminReady() {
  await requireAdminAuth();
  const settings = await ensureAdminSettings();
  if (settings.mustChangeCredentials) {
    redirect("/admin/skift-login");
  }
}
