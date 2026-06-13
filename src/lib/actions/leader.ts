"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { storeUploadedFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  getStaffSession,
  setLeaderSession,
  clearStaffSession,
} from "@/lib/session";
import { getFormField } from "@/lib/form-data";
import { parseDanishDateTimeInput } from "@/lib/visibility";
import { detectFileType, MAX_FILE_BYTES } from "@/lib/files";

import type { Group } from "@prisma/client";

type LeaderActionError = { error: string };

async function requireLeader(): Promise<Group | LeaderActionError> {
  const session = await getStaffSession();
  if (!session || session.loginType !== "gruppe") {
    return { error: "Du er logget ud. Log ind igen som gruppe." };
  }

  const group = await prisma.group.findUnique({ where: { id: session.groupId } });
  if (!group || !group.active) {
    await clearStaffSession();
    return { error: "Gruppen er ikke aktiv. Log ind igen." };
  }

  return group;
}

function isLeaderError(result: Group | LeaderActionError): result is LeaderActionError {
  return "error" in result;
}

export async function leaderLogin(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const username = getFormField(formData, "username").trim();
  const password = getFormField(formData, "password").trim();

  const group = await prisma.group.findFirst({
    where: { username, active: true },
  });

  if (!group || !(await verifyPassword(password, group.passwordHash))) {
    return { error: "Forkert brugernavn eller kode." };
  }

  await setLeaderSession(group.id);

  if (group.mustChangePassword) {
    redirect("/skift-kode");
  }

  redirect("/dashboard");
}

export async function leaderLogout() {
  await clearStaffSession();
  redirect("/login");
}

export async function changeLeaderPassword(formData: FormData) {
  const leader = await requireLeader();
  if (isLeaderError(leader)) return leader;
  const group = leader;
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 3) {
    return { error: "Koden skal være mindst 3 tegn." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Koderne matcher ikke." };
  }

  await prisma.group.update({
    where: { id: group.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });

  redirect("/dashboard");
}

export async function updateTaskVisibility(formData: FormData) {
  const leader = await requireLeader();
  if (isLeaderError(leader)) return leader;
  const group = leader;
  const taskId = String(formData.get("taskId") ?? "");
  const visible = formData.get("visible") === "true";

  const taskContent = await prisma.taskContent.findUnique({
    where: { taskId_groupId: { taskId, groupId: group.id } },
  });
  if (!taskContent) return { error: "Opgave ikke fundet." };

  await prisma.taskContent.update({
    where: { id: taskContent.id },
    data: { visibleToParticipants: visible },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/opgave/${taskId}`);
}

export async function saveTaskContent(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  try {
    const leader = await requireLeader();
    if (isLeaderError(leader)) return { error: leader.error };
    const group = leader;
  const taskId = String(formData.get("taskId") ?? "");
  const visible = formData.get("visible") === "on";
  const isCheckPost = formData.get("isCheckPost") === "on";
  const checkPostText = String(formData.get("checkPostText") ?? "").trim() || null;

  const taskContent = await prisma.taskContent.findUnique({
    where: { taskId_groupId: { taskId, groupId: group.id } },
    include: { items: true },
  });
  if (!taskContent) return { error: "Opgave ikke fundet." };

  await prisma.taskContent.update({
    where: { id: taskContent.id },
    data: { visibleToParticipants: visible, isCheckPost, checkPostText },
  });

  const existingIds = taskContent.items.map((i) => i.id);
  const keptIds = new Set<string>();

  const itemCount = Number(formData.get("itemCount") ?? 0);

  for (let index = 0; index < itemCount; index++) {
    const itemId = String(formData.get(`item_${index}_id`) ?? "");
    const type = String(formData.get(`item_${index}_type`) ?? "text");
    const body = String(formData.get(`item_${index}_body`) ?? "").trim();
    const useSchedule = formData.get(`item_${index}_useSchedule`) === "on";
    const showOpenTimeToParticipants =
      formData.get(`item_${index}_showOpenTime`) === "on";
    const visibleFrom = parseDanishDateTimeInput(
      String(formData.get(`item_${index}_fromDate`) ?? ""),
      String(formData.get(`item_${index}_fromTime`) ?? "")
    );
    const visibleUntil = parseDanishDateTimeInput(
      String(formData.get(`item_${index}_untilDate`) ?? ""),
      String(formData.get(`item_${index}_untilTime`) ?? "")
    );

    const file = formData.get(`item_${index}_file`) as File | null;
    let fileUrl: string | null = String(formData.get(`item_${index}_fileUrl`) ?? "") || null;
    let fileName: string | null = String(formData.get(`item_${index}_fileName`) ?? "") || null;

    let resolvedType = type;

    if (file && file.size > 0) {
      const detected = detectFileType(file.name);
      if (!detected) {
        return { error: `Filtypen understøttes ikke: ${file.name}` };
      }
      if (file.size > MAX_FILE_BYTES[detected]) {
        const maxMb = Math.round(MAX_FILE_BYTES[detected] / (1024 * 1024));
        return { error: `Filen er for stor (max ${maxMb} MB).` };
      }

      const ext = path.extname(file.name) || ".bin";
      const storedName = `${uuidv4()}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        fileUrl = await storeUploadedFile(storedName, buffer);
      } catch {
        return { error: "Kunne ikke gemme filen. Tjek at Blob-lager er sat op på Vercel." };
      }
      fileName = file.name;
      resolvedType = detected;
    }

    const data = {
      type: resolvedType === "text" && fileUrl ? "image" : resolvedType,
      body: body || null,
      fileUrl,
      fileName,
      useSchedule,
      showOpenTimeToParticipants: useSchedule ? showOpenTimeToParticipants : true,
      visibleFrom: useSchedule ? visibleFrom : null,
      visibleUntil: useSchedule ? visibleUntil : null,
      sortOrder: index,
    };

    if (itemId && existingIds.includes(itemId)) {
      keptIds.add(itemId);
      await prisma.contentItem.update({ where: { id: itemId }, data });
    } else if (body || fileUrl) {
      await prisma.contentItem.create({
        data: { ...data, taskContentId: taskContent.id },
      });
    } else if (type !== "text" && !fileUrl) {
      return {
        error: "Vælg en fil at uploade, eller tilføj tekst til elementet.",
      };
    }
  }

  const toDelete = existingIds.filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    await prisma.contentItem.deleteMany({ where: { id: { in: toDelete } } });
  }

  await prisma.taskContent.update({
    where: { id: taskContent.id },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/opgave/${taskId}`);
  revalidatePath(`/o/${taskId}`);
  return { success: true };
  } catch (error) {
    console.error("saveTaskContent failed:", error);
    return { error: "Kunne ikke gemme opgaven. Tjek databaseforbindelse og prøv igen." };
  }
}
