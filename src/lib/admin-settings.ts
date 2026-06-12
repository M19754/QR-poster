import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const ADMIN_ID = "default";

export async function ensureAdminSettings() {
  const existing = await prisma.adminSettings.findUnique({
    where: { id: ADMIN_ID },
  });
  if (existing) return existing;

  return prisma.adminSettings.create({
    data: {
      id: ADMIN_ID,
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
      mustChangeCredentials: true,
    },
  });
}
