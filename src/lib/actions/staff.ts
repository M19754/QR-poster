"use server";

import { redirect } from "next/navigation";
import { ensureAdminSettings } from "@/lib/admin-settings";
import { getFormField } from "@/lib/form-data";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import {
  clearLeaderSession,
  setAdminSession,
  setLeaderSession,
} from "@/lib/session";

export async function staffLogin(formData: FormData) {
  const username = getFormField(formData, "username").trim();
  const password = getFormField(formData, "password").trim();

  if (!username || !password) {
    redirect("/login?error=invalid");
  }

  const adminSettings = await ensureAdminSettings();
  if (
    username === adminSettings.username &&
    (await verifyPassword(password, adminSettings.passwordHash))
  ) {
    await clearLeaderSession();
    await setAdminSession();
    if (adminSettings.mustChangeCredentials) {
      redirect("/admin/skift-login");
    }
    redirect("/admin/forside");
  }

  const group = await prisma.group.findFirst({
    where: { username, active: true },
  });

  if (group && (await verifyPassword(password, group.passwordHash))) {
    await setLeaderSession(group.id);
    if (group.mustChangePassword) {
      redirect("/skift-kode");
    }
    redirect("/dashboard");
  }

  redirect("/login?error=invalid");
}
