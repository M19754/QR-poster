"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, getActiveCamp } from "@/lib/db";
import { cloneCampStructure } from "@/lib/camp";
import { hashPassword } from "@/lib/password";
import { ADMIN_PASSWORD, ADMIN_USERNAME } from "@/lib/admin-auth";
import {
  isAdminAuthenticated,
  setAdminSession,
  clearAdminSession,
} from "@/lib/session";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function adminLogin(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return { error: "Forkert brugernavn eller adgangskode." };
  }

  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createGroup(formData: FormData) {
  await requireAdmin();
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

  revalidatePath("/admin");
}

export async function updateGroup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!id || !name || !username) return;

  await prisma.group.update({
    where: { id },
    data: { name, username, active },
  });

  revalidatePath("/admin");
}

export async function deleteGroup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.group.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function createTask(formData: FormData) {
  await requireAdmin();
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

  revalidatePath("/admin");
}

export async function updateTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!id || !title) return;

  await prisma.task.update({
    where: { id },
    data: { title, active },
  });

  revalidatePath("/admin");
}

export async function deleteTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.task.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function updateCampSettings(formData: FormData) {
  await requireAdmin();
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

  revalidatePath("/admin");
}

export async function resetGroupPassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const camp = await getActiveCamp();
  if (!id || !camp) return;

  const passwordHash = await hashPassword(camp.defaultPassword);
  await prisma.group.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath("/admin");
}

export async function resetAllGroupPasswords() {
  await requireAdmin();
  const camp = await getActiveCamp();
  if (!camp) return;

  const passwordHash = await hashPassword(camp.defaultPassword);
  await prisma.group.updateMany({
    where: { campId: camp.id },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath("/admin");
}

export async function resetAllParticipants() {
  await requireAdmin();
  const camp = await getActiveCamp();
  if (!camp) return;

  await prisma.camp.update({
    where: { id: camp.id },
    data: { participantEpoch: camp.participantEpoch + 1 },
  });

  revalidatePath("/admin");
}

export async function startNewCamp(formData: FormData) {
  await requireAdmin();
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

  revalidatePath("/admin");
  revalidatePath("/admin/qr-print");
}
