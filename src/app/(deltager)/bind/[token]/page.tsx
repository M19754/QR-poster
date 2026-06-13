import { notFound } from "next/navigation";
import { prisma, getActiveCamp } from "@/lib/db";
import { BindClient } from "./BindClient";

export default async function BindPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const camp = await getActiveCamp();
  if (!camp) notFound();

  const group = await prisma.group.findFirst({
    where: { bindingToken: token, campId: camp.id, active: true },
    include: {
      holds: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!group) notFound();

  return (
    <BindClient
      token={token}
      groupName={group.name}
      campName={camp.name}
      holds={group.holds.map((h) => ({ id: h.id, name: h.name }))}
    />
  );
}
