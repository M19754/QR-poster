import type { ImportCampData } from "@/lib/import-camp";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

async function ensureTaskContentMatrix(campId: string) {
  const [groups, tasks] = await Promise.all([
    prisma.group.findMany({ where: { campId }, select: { id: true } }),
    prisma.task.findMany({ where: { campId }, select: { id: true } }),
  ]);

  for (const task of tasks) {
    for (const group of groups) {
      await prisma.taskContent.upsert({
        where: {
          taskId_groupId: { taskId: task.id, groupId: group.id },
        },
        create: { taskId: task.id, groupId: group.id },
        update: {},
      });
    }
  }
}

export async function applyCampImport(
  campId: string,
  defaultPassword: string,
  data: ImportCampData,
  mode: "merge" | "replace"
) {
  if (mode === "replace") {
    const taskIds = (
      await prisma.task.findMany({ where: { campId }, select: { id: true } })
    ).map((t) => t.id);

    if (taskIds.length > 0) {
      const taskContents = await prisma.taskContent.findMany({
        where: { taskId: { in: taskIds } },
        select: { id: true },
      });
      const taskContentIds = taskContents.map((tc) => tc.id);

      if (taskContentIds.length > 0) {
        await prisma.contentItem.deleteMany({
          where: { taskContentId: { in: taskContentIds } },
        });
      }
      await prisma.taskContent.deleteMany({ where: { taskId: { in: taskIds } } });
    }

    await prisma.task.deleteMany({ where: { campId } });
    await prisma.group.deleteMany({ where: { campId } });
  }

  const passwordHash = await hashPassword(defaultPassword);
  let groupsCreated = 0;
  let groupsUpdated = 0;
  let tasksCreated = 0;
  let tasksUpdated = 0;

  for (const row of data.groups) {
    const existing = await prisma.group.findFirst({
      where: { campId, username: row.username },
    });

    if (existing) {
      await prisma.group.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          sortOrder: row.sortOrder,
          active: row.active,
        },
      });
      groupsUpdated++;
    } else {
      await prisma.group.create({
        data: {
          campId,
          name: row.name,
          username: row.username,
          passwordHash,
          mustChangePassword: true,
          sortOrder: row.sortOrder,
          active: row.active,
        },
      });
      groupsCreated++;
    }
  }

  for (const row of data.tasks) {
    const existing = await prisma.task.findFirst({
      where: { campId, title: row.title },
    });

    if (existing) {
      await prisma.task.update({
        where: { id: existing.id },
        data: {
          sortOrder: row.sortOrder,
          active: row.active,
        },
      });
      tasksUpdated++;
    } else {
      await prisma.task.create({
        data: {
          campId,
          title: row.title,
          sortOrder: row.sortOrder,
          active: row.active,
        },
      });
      tasksCreated++;
    }
  }

  await ensureTaskContentMatrix(campId);

  return {
    groupsCreated,
    groupsUpdated,
    tasksCreated,
    tasksUpdated,
  };
}
