"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/session";

async function requireLeaderGroupId(): Promise<string> {
  const session = await getStaffSession();
  if (!session || session.loginType !== "gruppe") {
    throw new Error("Ikke logget ind som gruppe.");
  }
  return session.groupId;
}

export async function createHold(formData: FormData) {
  const groupId = await requireLeaderGroupId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const count = await prisma.hold.count({ where: { groupId } });
  await prisma.hold.create({ data: { groupId, name, sortOrder: count } });
  revalidatePath("/dashboard/hold");
}

export async function renameHold(formData: FormData) {
  const groupId = await requireLeaderGroupId();
  const holdId = String(formData.get("holdId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name || !holdId) return;

  const hold = await prisma.hold.findFirst({ where: { id: holdId, groupId } });
  if (!hold) return;

  await prisma.hold.update({ where: { id: holdId }, data: { name } });
  revalidatePath("/dashboard/hold");
}

export async function deleteHold(formData: FormData) {
  const groupId = await requireLeaderGroupId();
  const holdId = String(formData.get("holdId") ?? "");
  if (!holdId) return;

  const hold = await prisma.hold.findFirst({ where: { id: holdId, groupId } });
  if (!hold) return;

  await prisma.hold.delete({ where: { id: holdId } });
  revalidatePath("/dashboard/hold");
}

export async function regenerateBindingToken(formData: FormData) {
  void formData;
  const groupId = await requireLeaderGroupId();
  await prisma.group.update({
    where: { id: groupId },
    data: {
      bindingToken: uuidv4(),
      bindingTokenVersion: { increment: 1 },
    },
  });
  revalidatePath("/dashboard/hold");
}

export async function updateGroupSettings(formData: FormData) {
  const groupId = await requireLeaderGroupId();
  const showCheckPostOverview = formData.get("showCheckPostOverview") === "on";
  await prisma.group.update({
    where: { id: groupId },
    data: { showCheckPostOverview },
  });
  revalidatePath("/dashboard/hold");
}
