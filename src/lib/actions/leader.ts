"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { storeUploadedFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  getLeaderGroupId,
  setLeaderSession,
  clearLeaderSession,
} from "@/lib/session";
import { parseDanishDateTimeInput } from "@/lib/visibility";
import { detectFileType, MAX_FILE_BYTES } from "@/lib/files";

async function requireLeader() {
  const groupId = await getLeaderGroupId();
  if (!groupId) redirect("/login");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || !group.active) {
    await clearLeaderSession();
    redirect("/login");
  }

  return group;
}

export async function leaderLogin(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

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
  await clearLeaderSession();
  redirect("/login");
}

export async function changeLeaderPassword(formData: FormData) {
  const group = await requireLeader();
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
  const group = await requireLeader();
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

export async function saveTaskContent(formData: FormData) {
  const group = await requireLeader();
  const taskId = String(formData.get("taskId") ?? "");
  const visible = formData.get("visible") === "on";

  const taskContent = await prisma.taskContent.findUnique({
    where: { taskId_groupId: { taskId, groupId: group.id } },
    include: { items: true },
  });
  if (!taskContent) return { error: "Opgave ikke fundet." };

  await prisma.taskContent.update({
    where: { id: taskContent.id },
    data: { visibleToParticipants: visible },
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
      fileUrl = await storeUploadedFile(storedName, buffer);
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
}
