import { StaffLayout } from "@/components/layouts/StaffLayout";

export default function StyringRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffLayout>{children}</StaffLayout>;
}
