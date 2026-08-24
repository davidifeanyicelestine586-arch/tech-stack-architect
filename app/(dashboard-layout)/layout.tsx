"use client";

import React from "react";
import Header from "./layout/vertical/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Footer from "./layout/footer/page";
import { AppSidebar } from "./layout/vertical/sidebar/app-sidebar";
import { TechStackProvider } from "@/context/tech-stack-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TechStackProvider>
      <SidebarProvider
        defaultOpen={true}
        style={{ "--sidebar-width-icon": "52px" } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="overflow-hidden min-h-screen bg-background">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
            <div className="min-h-[calc(100vh-180px)]">{children}</div>
            <Footer />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TechStackProvider>
  );
}
