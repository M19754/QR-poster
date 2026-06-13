import { NextResponse, type NextRequest } from "next/server";
import { prisma, getActiveCamp } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/participant-session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SHORT_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomShortCode() {
  let c = "";
  for (let i = 0; i < 7; i++) {
    if (i === 3) { c += "-"; continue; }
    c += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return c;
}

async function uniqueShortCode() {
  for (let i = 0; i < 20; i++) {
    const code = randomShortCode();
    const exists = await prisma.participantSession.findUnique({ where: { shortCode: code } });
    if (!exists) return code;
  }
  throw new Error("Kan ikke generere unik kode");
}

/** POST /api/bind — opret ny session */
export async function POST(request: NextRequest) {
  try {
    const { token, holdId } = (await request.json()) as {
      token: string;
      holdId?: string | null;
    };

    if (!token) {
      return NextResponse.json({ error: "Manglende token." }, { status: 400 });
    }

    const camp = await getActiveCamp();
    if (!camp) {
      return NextResponse.json({ error: "Ingen aktiv lejr." }, { status: 404 });
    }

    const group = await prisma.group.findFirst({
      where: { bindingToken: token, campId: camp.id, active: true },
      include: {
        holds: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Ugyldigt eller udløbet link. Bed lederne om at vise QR-koden igen." },
        { status: 404 }
      );
    }

    let resolvedHoldId: string | null = null;
    if (holdId) {
      const hold = group.holds.find((h) => h.id === holdId);
      if (!hold) {
        return NextResponse.json({ error: "Ugyldigt hold." }, { status: 400 });
      }
      resolvedHoldId = hold.id;
    }

    const shortCode = await uniqueShortCode();
    const session = await prisma.participantSession.create({
      data: {
        campId: camp.id,
        groupId: group.id,
        holdId: resolvedHoldId,
        shortCode,
      },
    });

    const holdName = resolvedHoldId
      ? (group.holds.find((h) => h.id === resolvedHoldId)?.name ?? null)
      : null;

    const res = NextResponse.json({
      sessionId: session.id,
      shortCode: session.shortCode,
      groupName: group.name,
      holdName,
      holds: group.holds.map((h) => ({ id: h.id, name: h.name })),
    });

    res.cookies.set(SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return res;
  } catch (err) {
    console.error("Bind POST:", err);
    return NextResponse.json({ error: "Noget gik galt. Prøv igen." }, { status: 500 });
  }
}

/** PATCH /api/bind — opdatér hold på eksisterende session */
export async function PATCH(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Ingen session." }, { status: 401 });
    }

    const { holdId } = (await request.json()) as { holdId: string };

    const session = await prisma.participantSession.findUnique({
      where: { id: sessionId },
      include: { group: { include: { holds: true } } },
    });
    if (!session) {
      return NextResponse.json({ error: "Session ikke fundet." }, { status: 404 });
    }

    const hold = session.group.holds.find((h) => h.id === holdId && h.active);
    if (!hold) {
      return NextResponse.json({ error: "Ugyldigt hold." }, { status: 400 });
    }

    await prisma.participantSession.update({
      where: { id: sessionId },
      data: { holdId },
    });

    return NextResponse.json({ ok: true, holdName: hold.name });
  } catch (err) {
    console.error("Bind PATCH:", err);
    return NextResponse.json({ error: "Noget gik galt." }, { status: 500 });
  }
}

/** POST /api/bind/recover — gendan session fra shortCode */
export async function PUT(request: NextRequest) {
  try {
    const { shortCode } = (await request.json()) as { shortCode: string };
    if (!shortCode) {
      return NextResponse.json({ error: "Manglende kode." }, { status: 400 });
    }

    const session = await prisma.participantSession.findUnique({
      where: { shortCode: shortCode.toUpperCase().replace(/\s/g, "") },
      include: {
        group: { select: { name: true } },
        hold: { select: { name: true } },
        camp: { select: { active: true } },
      },
    });

    if (!session || !session.camp.active) {
      return NextResponse.json({ error: "Koden er ugyldig eller udløbet." }, { status: 404 });
    }

    const res = NextResponse.json({
      sessionId: session.id,
      shortCode: session.shortCode,
      groupName: session.group.name,
      holdName: session.hold?.name ?? null,
    });

    res.cookies.set(SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return res;
  } catch (err) {
    console.error("Bind PUT:", err);
    return NextResponse.json({ error: "Noget gik galt." }, { status: 500 });
  }
}
