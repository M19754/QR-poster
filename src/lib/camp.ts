import type { Camp, Group, Task } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function cloneCampStructure(
  newCamp: Camp,
  groups: Group[],
  tasks: Task[]
) {
  const passwordHash = await hashPassword(newCamp.defaultPassword);

  const groupMap = new Map<string, string>();
  for (const group of groups) {
    const created = await prisma.group.create({
      data: {
        campId: newCamp.id,
        name: group.name,
        username: group.username,
        passwordHash,
        mustChangePassword: true,
        sortOrder: group.sortOrder,
        active: group.active,
      },
    });
    groupMap.set(group.id, created.id);
  }

  for (const task of tasks) {
    const createdTask = await prisma.task.create({
      data: {
        campId: newCamp.id,
        title: task.title,
        sortOrder: task.sortOrder,
        active: task.active,
      },
    });

    for (const [, newGroupId] of groupMap) {
      await prisma.taskContent.create({
        data: { taskId: createdTask.id, groupId: newGroupId },
      });
    }
  }
}

export async function getCampExportData(campId: string) {
  return prisma.camp.findUnique({
    where: { id: campId },
    include: {
      groups: { orderBy: { sortOrder: "asc" } },
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: {
          taskContents: {
            include: {
              group: { select: { name: true, username: true } },
              items: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });
}
