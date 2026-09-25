"use client";

import React from "react";
import Header from "./layout/vertical/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/components/layout/footer";
import { AppSidebar } from "./layout/vertical/sidebar/app-sidebar";
import { TechStackProvider } from "@/context/tech-stack-context";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lg outline-none transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary"
      >
        Skip to main content
      </a>
      <TechStackProvider>
      <SidebarProvider
        defaultOpen={true}
        style={{ "--sidebar-width-icon": "52px" } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="m-2 min-h-[calc(100svh-1rem)] min-w-0 overflow-x-hidden rounded-none! outline outline-border">
          <Header />
          <div className="flex flex-1 flex-col gap-4 p-4 max-lg:pt-16">
            <div className={cn("mx-auto w-full", "container")}>
              <div id="main-content" className="min-h-[calc(100vh-140px)] scroll-mt-24">{children}</div>
              <div className="pt-6">
                <Footer />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      </TechStackProvider>
    </>
  );
}
