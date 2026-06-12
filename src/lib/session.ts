import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_SECRET as DEFAULT_SESSION_SECRET } from "@/lib/admin-auth";
import type { LoginType, StaffSession } from "@/lib/login-type";

const ADMIN_COOKIE = "qr_admin_session";
const LEADER_COOKIE = "qr_leader_session";
const LOGIN_TYPE_COOKIE = "qr_login_type";

function getSecret() {
  return process.env.SESSION_SECRET ?? DEFAULT_SESSION_SECRET;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createToken(payload: string) {
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifyToken(token: string) {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return payload;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createToken("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  await setLoginType("admin");
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function setLoginType(loginType: LoginType) {
  const cookieStore = await cookies();
  cookieStore.set(LOGIN_TYPE_COOKIE, loginType, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearLoginType() {
  const cookieStore = await cookies();
  cookieStore.delete(LOGIN_TYPE_COOKIE);
}

export async function getLoginType(): Promise<LoginType | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOGIN_TYPE_COOKIE)?.value;
  if (value === "admin" || value === "gruppe") return value;
  return null;
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const loginType = await getLoginType();
  if (loginType === "admin" && (await isAdminAuthenticated())) {
    return { loginType: "admin" };
  }
  if (loginType === "gruppe") {
    const groupId = await getLeaderGroupId();
    if (groupId) return { loginType: "gruppe", groupId };
  }
  return null;
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token) === "admin";
}

export async function setLeaderSession(groupId: string) {
  const cookieStore = await cookies();
  cookieStore.set(LEADER_COOKIE, createToken(groupId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  await setLoginType("gruppe");
}

export async function clearLeaderSession() {
  const cookieStore = await cookies();
  cookieStore.delete(LEADER_COOKIE);
}

export async function clearStaffSession() {
  await clearAdminSession();
  await clearLeaderSession();
  await clearLoginType();
}

export async function getLeaderGroupId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(LEADER_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload;
}
