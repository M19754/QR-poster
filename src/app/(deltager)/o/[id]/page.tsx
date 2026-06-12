import { notFound } from "next/navigation";
import { prisma, getActiveCamp } from "@/lib/db";
import { buildParticipantItems } from "@/lib/participant";
import { ParticipantView } from "@/components/ParticipantView";

export default async function ParticipantTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const camp = await getActiveCamp();
  if (!camp) notFound();

  const task = await prisma.task.findFirst({
    where: { id, campId: camp.id, active: true },
  });
  if (!task) notFound();

  const groups = await prisma.group.findMany({
    where: { campId: camp.id, active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  const taskContents = await prisma.taskContent.findMany({
    where: { taskId: task.id, groupId: { in: groups.map((g) => g.id) } },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  const contentByGroup: Record<string, ReturnType<typeof buildParticipantItems>> = {};
  const visibilityByGroup: Record<string, boolean> = {};
  for (const tc of taskContents) {
    visibilityByGroup[tc.groupId] = tc.visibleToParticipants;
    contentByGroup[tc.groupId] = tc.visibleToParticipants
      ? buildParticipantItems(tc.items)
      : [];
  }

  return (
    <ParticipantView
      task={task}
      campId={camp.id}
      epoch={camp.participantEpoch}
      campName={camp.name}
      groups={groups}
      contentByGroup={contentByGroup}
      visibilityByGroup={visibilityByGroup}
    />
  );
}
