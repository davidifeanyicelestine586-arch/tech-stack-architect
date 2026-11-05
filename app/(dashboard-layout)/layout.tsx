import type { ReactNode } from "react";
import Footer from "@/components/layout/footer";
import { DashboardClientShell } from "./dashboard-client-shell";
import Header from "./layout/vertical/header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <DashboardClientShell header={<Header />} footer={<Footer />}>
      {children}
    </DashboardClientShell>
  );
}
