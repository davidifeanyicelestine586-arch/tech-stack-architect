"use client";

import React from "react";
import Header from "./layout/vertical/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Footer from "./layout/footer/page";
import { AppSidebar } from "./layout/vertical/sidebar/app-sidebar";
import { TechStackProvider } from "@/context/tech-stack-context";
import { cn } from "@/lib/utils";

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
        <SidebarInset className="m-2 h-[calc(100svh-1rem)] min-h-0 overflow-x-hidden overflow-y-auto rounded-none! outline outline-border">
          <Header />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className={cn("mx-auto w-full", "container")}>
              <div className="min-h-[calc(100vh-140px)]">{children}</div>
              <div className="pt-6">
                <Footer />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TechStackProvider>
  );
}
