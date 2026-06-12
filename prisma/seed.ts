import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.contentItem.deleteMany();
  await prisma.taskContent.deleteMany();
  await prisma.task.deleteMany();
  await prisma.group.deleteMany();
  await prisma.camp.deleteMany();

  const adminPasswordHash = await bcrypt.hash("1234", 10);
  await prisma.adminSettings.upsert({
    where: { id: "default" },
    update: {
      username: "1234",
      passwordHash: adminPasswordHash,
      mustChangeCredentials: true,
    },
    create: {
      id: "default",
      username: "1234",
      passwordHash: adminPasswordHash,
      mustChangeCredentials: true,
    },
  });

  const defaultPassword = process.env.DEFAULT_GROUP_PASSWORD ?? "E26";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const camp = await prisma.camp.create({
    data: {
      name: "Sommerlejr 2026",
      active: true,
      participantEpoch: 1,
      defaultPassword,
    },
  });

  const groups = await Promise.all(
    [
      { name: "Gruppe 1", username: "Grp. 1", sortOrder: 1 },
      { name: "Gruppe 2", username: "Grp. 2", sortOrder: 2 },
      { name: "Gruppe 3", username: "Grp. 3", sortOrder: 3 },
    ].map((g) =>
      prisma.group.create({
        data: {
          campId: camp.id,
          name: g.name,
          username: g.username,
          passwordHash,
          mustChangePassword: true,
          sortOrder: g.sortOrder,
        },
      })
    )
  );

  const tasks = await Promise.all(
    [
      { title: "Opgave 1 — Velkommen", sortOrder: 1 },
      { title: "Opgave 2 — Aktivitet", sortOrder: 2 },
      { title: "Opgave 3 — Aftensmad", sortOrder: 3 },
      { title: "Opgave 4 — Bål", sortOrder: 4 },
      { title: "Opgave 5 — Afslutning", sortOrder: 5 },
    ].map((t) =>
      prisma.task.create({
        data: {
          campId: camp.id,
          title: t.title,
          sortOrder: t.sortOrder,
        },
      })
    )
  );

  for (const task of tasks) {
    for (const group of groups) {
      await prisma.taskContent.create({
        data: {
          taskId: task.id,
          groupId: group.id,
        },
      });
    }
  }

  console.log("Seed fuldført:");
  console.log(`  Lejr: ${camp.name}`);
  console.log(`  Grupper: ${groups.length}`);
  console.log(`  Opgaver: ${tasks.length}`);
  console.log(`  Standard gruppekode: ${defaultPassword}`);
  console.log("  Admin: 1234 / 1234 (skift ved første login)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
