import { ParticipantLayout } from "@/components/layouts/ParticipantLayout";

export default function DeltagerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ParticipantLayout>{children}</ParticipantLayout>;
}
