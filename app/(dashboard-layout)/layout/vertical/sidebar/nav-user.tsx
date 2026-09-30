"use client";

import { BookMarked, GitFork } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroupContent,
  SidebarGroup,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavUser() {
  const navItems = [
    {
      title: "GitHub Repository",
      url: "https://github.com/davidifeanyicelestine586-arch/tech-stack-architect",
      icon: GitFork,
    },
    {
      title: "Detailed Documentation",
      url: "/content-detail",
      icon: BookMarked,
    },
  ];

  return (
    <SidebarGroup className="mt-auto p-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link
                href={item.url}
                target={item.url.startsWith("http") ? "_blank" : undefined}
                className="flex min-h-10 items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <item.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
