// This is a server component — dynamic export works here
export const dynamic = "force-dynamic";

import DashboardClientLayout from "./client-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
