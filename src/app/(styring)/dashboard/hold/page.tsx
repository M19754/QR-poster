import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/session";
import { StaffPageShell } from "@/components/layouts/StaffLayout";
import { Button, Card } from "@/components/ui";
import {
  createHold,
  renameHold,
  deleteHold,
  regenerateBindingToken,
  updateGroupSettings,
} from "@/lib/actions/holds";
import { BindingQRDisplay } from "@/components/BindingQRDisplay";

export default async function HoldPage() {
  const session = await getStaffSession();
  if (!session || session.loginType !== "gruppe") redirect("/login");

  const group = await prisma.group.findUnique({
    where: { id: session.groupId },
    include: {
      camp: true,
      holds: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!group) redirect("/login");
  if (group.mustChangePassword) redirect("/skift-kode");

  const bindUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/bind/${group.bindingToken}`;

  return (
    <StaffPageShell
      title="Hold & QR-binding"
      subtitle={group.name}
      actions={
        <Link href="/dashboard">
          <Button variant="secondary" type="button">
            ← Tilbage
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* QR-kode sektion */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Gruppe-QR (binding)</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Deltagerne scanner denne QR-kode for at blive tilknyttet{" "}
            <strong>{group.name}</strong>. Regenerér koden hvis den er kompromitteret
            — eksisterende tilknytninger bevares.
          </p>
          <BindingQRDisplay url={bindUrl} groupName={group.name} />
          <form action={regenerateBindingToken} className="mt-4">
            <Button type="submit" variant="secondary">
              Regenerér QR-kode
            </Button>
          </form>
        </Card>

        {/* Hold-administration */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Hold</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Opret hold som deltagerne vælger imellem ved binding. Har du ingen hold, er hele
            gruppen ét samlet hold.
          </p>

          {group.holds.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {group.holds.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2"
                >
                  <form action={renameHold} className="flex flex-1 gap-2">
                    <input type="hidden" name="holdId" value={h.id} />
                    <input
                      type="text"
                      name="name"
                      defaultValue={h.name}
                      className="min-h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm outline-none ring-[var(--accent)] focus:ring-2"
                    />
                    <Button type="submit" variant="secondary" className="min-h-9 px-3 text-xs">
                      Gem
                    </Button>
                  </form>
                  <form action={deleteHold}>
                    <input type="hidden" name="holdId" value={h.id} />
                    <Button type="submit" variant="danger" className="min-h-9 px-3 text-xs">
                      Slet
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm italic text-[var(--muted)]">Ingen hold oprettet.</p>
          )}

          <form action={createHold} className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Holdnavn…"
              required
              className="min-h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            />
            <Button type="submit" variant="primary">
              Opret hold
            </Button>
          </form>
        </Card>

        {/* Indstillinger */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Gruppeindstillinger</h2>
          <form action={updateGroupSettings}>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="showCheckPostOverview"
                defaultChecked={group.showCheckPostOverview}
                className="h-4 w-4"
              />
              Vis deltagerne en oversigt over afkrydsede tjek-poster
            </label>
            <div className="mt-3">
              <Button type="submit" variant="primary">
                Gem indstillinger
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </StaffPageShell>
  );
}
