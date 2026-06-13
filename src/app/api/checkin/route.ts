import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/participant-session";

const DEFAULT_TEXT = "Du har nu tjekket denne post af!";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Ingen session." }, { status: 401 });
    }

    const { taskId } = (await request.json()) as { taskId: string };
    if (!taskId) {
      return NextResponse.json({ error: "Manglende opgave-id." }, { status: 400 });
    }

    const session = await prisma.participantSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: "Session ugyldig." }, { status: 401 });
    }

    const taskContent = await prisma.taskContent.findUnique({
      where: { taskId_groupId: { taskId, groupId: session.groupId } },
    });

    if (!taskContent?.isCheckPost) {
      return NextResponse.json({ error: "Ikke en tjek-post." }, { status: 400 });
    }

    // Check om der allerede er tjekket ind for dette hold/gruppe
    const existing = await prisma.taskCheckIn.findFirst({
      where: {
        taskId,
        groupId: session.groupId,
        holdId: session.holdId ?? null,
      },
    });

    const confirmationText = taskContent.checkPostText?.trim() || DEFAULT_TEXT;

    if (existing) {
      return NextResponse.json({
        alreadyCheckedIn: true,
        checkedAt: existing.checkedAt.toISOString(),
        confirmationText,
      });
    }

    const checkIn = await prisma.taskCheckIn.create({
      data: {
        taskId,
        groupId: session.groupId,
        holdId: session.holdId,
        sessionId,
      },
    });

    return NextResponse.json({
      alreadyCheckedIn: false,
      checkedAt: checkIn.checkedAt.toISOString(),
      confirmationText,
    });
  } catch (err) {
    console.error("Checkin error:", err);
    return NextResponse.json({ error: "Noget gik galt." }, { status: 500 });
  }
}
