"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, getActiveCamp } from "@/lib/db";
import { cloneCampStructure } from "@/lib/camp";
import { applyCampImport } from "@/lib/apply-camp-import";
import { requireAdminAuth, requireAdminReady } from "@/lib/admin-guard";
import { ensureAdminSettings } from "@/lib/admin-settings";
import { getFormField } from "@/lib/form-data";
import { parseImportFile } from "@/lib/import-camp";
import { hashPassword } from "@/lib/password";
import {
  clearStaffSession,
} from "@/lib/session";

function revalidateAdmin() {
  revalidatePath("/admin/forside");
  revalidatePath("/admin/grupper");
  revalidatePath("/admin/opgaver");
}

export async function changeAdminCredentials(formData: FormData) {
  await requireAdminAuth();
  const settings = await ensureAdminSettings();
  if (!settings.mustChangeCredentials) redirect("/admin/forside");

  const username = getFormField(formData, "username").trim();
  const newPassword = getFormField(formData, "newPassword").trim();
  const confirmPassword = getFormField(formData, "confirmPassword").trim();

  if (username.length < 2) {
    redirect("/admin/skift-login?error=username");
  }
  if (newPassword.length < 3) {
    redirect("/admin/skift-login?error=password");
  }
  if (newPassword !== confirmPassword) {
    redirect("/admin/skift-login?error=mismatch");
  }

  await prisma.adminSettings.update({
    where: { id: "default" },
    data: {
      username,
      passwordHash: await hashPassword(newPassword),
      mustChangeCredentials: false,
    },
  });

  redirect("/admin/forside");
}

export async function adminLogout() {
  await clearStaffSession();
  redirect("/login");
}

export async function createGroup(formData: FormData) {
  await requireAdminReady();
  const camp = await getActiveCamp();
  if (!camp) return;

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  if (!name || !username) return;

  const passwordHash = await hashPassword(camp.defaultPassword);

  const group = await prisma.group.create({
    data: {
      campId: camp.id,
      name,
      username,
      passwordHash,
      mustChangePassword: true,
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  const tasks = await prisma.task.findMany({ where: { campId: camp.id } });
  for (const task of tasks) {
    await prisma.taskContent.create({
      data: { taskId: task.id, groupId: group.id },
    });
  }

  revalidateAdmin();
}

export async function updateGroup(formData: FormData) {
  await requireAdminReady();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!id || !name || !username) return;

  await prisma.group.update({
    where: { id },
    data: { name, username, active },
  });

  revalidateAdmin();
}

export async function deleteGroup(formData: FormData) {
  await requireAdminReady();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.group.delete({ where: { id } });
  revalidateAdmin();
}

export async function createTask(formData: FormData) {
  await requireAdminReady();
  const camp = await getActiveCamp();
  if (!camp) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const task = await prisma.task.create({
    data: {
      campId: camp.id,
      title,
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  const groups = await prisma.group.findMany({ where: { campId: camp.id } });
  for (const group of groups) {
    await prisma.taskContent.create({
      data: { taskId: task.id, groupId: group.id },
    });
  }

  revalidateAdmin();
}

export async function updateTask(formData: FormData) {
  await requireAdminReady();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!id || !title) return;

  await prisma.task.update({
    where: { id },
    data: { title, active },
  });

  revalidateAdmin();
}

export async function deleteTask(formData: FormData) {
  await requireAdminReady();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.task.delete({ where: { id } });
  revalidateAdmin();
}

export async function updateCampSettings(formData: FormData) {
  await requireAdminReady();
  const camp = await getActiveCamp();
  if (!camp) return;

  const name = String(formData.get("name") ?? "").trim();
  const defaultPassword = String(formData.get("defaultPassword") ?? "").trim();

  await prisma.camp.update({
    where: { id: camp.id },
    data: {
      name: name || camp.name,
      defaultPassword: defaultPassword || camp.defaultPassword,
    },
  });

  revalidateAdmin();
}

export async function resetGroupPassword(formData: FormData) {
  await requireAdminReady();
  const id = String(formData.get("id") ?? "");
  const camp = await getActiveCamp();
  if (!id || !camp) return;

  const passwordHash = await hashPassword(camp.defaultPassword);
  await prisma.group.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidateAdmin();
}

export async function resetAllGroupPasswords() {
  await requireAdminReady();
  const camp = await getActiveCamp();
  if (!camp) return;

  const passwordHash = await hashPassword(camp.defaultPassword);
  await prisma.group.updateMany({
    where: { campId: camp.id },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidateAdmin();
}

export async function resetAllParticipants() {
  await requireAdminReady();
  const camp = await getActiveCamp();
  if (!camp) return;

  await prisma.camp.update({
    where: { id: camp.id },
    data: { participantEpoch: camp.participantEpoch + 1 },
  });

  revalidateAdmin();
}

export async function updateWelcomeText(formData: FormData) {
  await requireAdminReady();
  const camp = await getActiveCamp();
  if (!camp) return;

  const welcomeText = String(formData.get("welcomeText") ?? "").trim() || null;

  await prisma.camp.update({
    where: { id: camp.id },
    data: { welcomeText },
  });

  revalidateAdmin();
}

export async function importCampStructure(formData: FormData) {
  await requireAdminReady();
  const camp = await getActiveCamp();
  if (!camp) redirect("/admin/forside?importError=no-camp");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/forside?importError=no-file");
  }

  const text = await file.text();
  const parsed = parseImportFile(file.name, text);
  if (!parsed.ok) {
    redirect(`/admin/forside?importError=${encodeURIComponent(parsed.error)}`);
  }

  const mode = formData.get("replace") === "on" ? "replace" : "merge";
  const result = await applyCampImport(
    camp.id,
    camp.defaultPassword,
    parsed.data,
    mode
  );

  const summary = [
    result.groupsCreated ? `${result.groupsCreated} grupper oprettet` : "",
    result.groupsUpdated ? `${result.groupsUpdated} grupper opdateret` : "",
    result.tasksCreated ? `${result.tasksCreated} opgaver oprettet` : "",
    result.tasksUpdated ? `${result.tasksUpdated} opgaver opdateret` : "",
  ]
    .filter(Boolean)
    .join(", ");

  redirect(`/admin/forside?importOk=${encodeURIComponent(summary || "Import fuldført")}`);
}

export async function startNewCamp(formData: FormData) {
  await requireAdminReady();
  const current = await getActiveCamp();
  if (!current) return;

  const name = String(formData.get("name") ?? "").trim();
  const copyStructure = formData.get("copyStructure") === "on";
  if (!name) return;

  const groups = await prisma.group.findMany({
    where: { campId: current.id },
    orderBy: { sortOrder: "asc" },
  });
  const tasks = await prisma.task.findMany({
    where: { campId: current.id },
    orderBy: { sortOrder: "asc" },
  });

  await prisma.camp.update({
    where: { id: current.id },
    data: { active: false, archivedAt: new Date() },
  });

  const newCamp = await prisma.camp.create({
    data: {
      name,
      active: true,
      participantEpoch: 1,
      defaultPassword: current.defaultPassword,
    },
  });

  if (copyStructure && (groups.length > 0 || tasks.length > 0)) {
    await cloneCampStructure(newCamp, groups, tasks);
  }

  revalidateAdmin();
  revalidatePath("/admin/qr-print");
}
