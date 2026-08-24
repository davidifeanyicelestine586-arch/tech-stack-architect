"use client";

import { BookMarked, GitFork } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
      title: "Database Specification",
      url: "/#docs",
      icon: BookMarked,
    },
  ];

  return (
    <SidebarGroup className="mt-auto p-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                size="sm"
                className="h-8 cursor-pointer text-xs"
                render={<Link href={item.url} target={item.url.startsWith("http") ? "_blank" : undefined} />}
              >
                <item.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
