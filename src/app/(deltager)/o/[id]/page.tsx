import { notFound, redirect } from "next/navigation";
import { prisma, getActiveCamp } from "@/lib/db";
import { buildParticipantItems } from "@/lib/participant";
import { resolveParticipantEntries } from "@/lib/blob-playback";
import { getParticipantSession } from "@/lib/participant-session";
import { TaskView } from "./TaskView";

export default async function ParticipantTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getParticipantSession();
  if (!session) redirect("/velkommen");

  const camp = await getActiveCamp();
  if (!camp || session.campId !== camp.id) redirect("/velkommen");

  const task = await prisma.task.findFirst({
    where: { id, campId: camp.id, active: true },
  });
  if (!task) notFound();

  const taskContent = await prisma.taskContent.findUnique({
    where: { taskId_groupId: { taskId: id, groupId: session.groupId } },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  const isVisible = taskContent?.visibleToParticipants ?? false;
  const isCheckPost = taskContent?.isCheckPost ?? false;

  let alreadyCheckedIn = false;
  if (isCheckPost) {
    const existing = await prisma.taskCheckIn.findFirst({
      where: {
        taskId: id,
        groupId: session.groupId,
        holdId: session.holdId ?? null,
      },
    });
    alreadyCheckedIn = !!existing;
  }

  const rawItems = isVisible && taskContent ? taskContent.items : [];
  const entries = rawItems.length > 0
    ? await resolveParticipantEntries(buildParticipantItems(rawItems))
    : [];

  return (
    <TaskView
      taskId={task.id}
      taskTitle={task.title}
      campName={camp.name}
      groupName={session.group.name}
      holdName={session.hold?.name ?? null}
      entries={entries}
      isVisible={isVisible}
      isCheckPost={isCheckPost}
      checkPostText={taskContent?.checkPostText ?? null}
      alreadyCheckedIn={alreadyCheckedIn}
      showCheckPostOverview={session.group.showCheckPostOverview}
    />
  );
}
