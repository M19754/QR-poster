import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "participant_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 år

export type ResolvedSession = {
  id: string;
  campId: string;
  groupId: string;
  holdId: string | null;
  shortCode: string;
  group: { id: string; name: string; showCheckPostOverview: boolean };
  hold: { id: string; name: string } | null;
};

export async function getParticipantSession(): Promise<ResolvedSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.participantSession.findUnique({
    where: { id: sessionId },
    include: {
      group: { select: { id: true, name: true, showCheckPostOverview: true } },
      hold: { select: { id: true, name: true } },
    },
  });

  if (!session) return null;

  // Opdater lastSeenAt i baggrunden
  prisma.participantSession
    .update({ where: { id: sessionId }, data: { lastSeenAt: new Date() } })
    .catch(() => {});

  return session;
}

export function buildSessionCookieValue(sessionId: string) {
  return `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`;
}
