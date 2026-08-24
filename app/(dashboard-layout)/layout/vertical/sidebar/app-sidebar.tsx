"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import FullLogo from "../../shared/logo/full-logo";
import sidebaritems from "./sidebaritems";
import NavCollapse from "./nav-collapse";
import SimpleBar from "simplebar-react";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { Badge } from "@/components/ui/badge";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      {...props}
      className="sidebar-box **:data-[slot=sidebar-inner]:bg-background **:data-[slot=sidebar-inner]:border **:data-[slot=sidebar-inner]:border-border group-data-[state=collapsed]:hover:shadow-xl"
      side="left"
    >
      <SidebarHeader className="flex flex-row items-center justify-between border-b border-border p-3 group-data-[state=collapsed]:px-2.5">
        <FullLogo />
        <Badge
          className="group-data-[state=collapsed]:hidden"
          variant="secondary"
        >
          v2.0
        </Badge>
      </SidebarHeader>

      <SidebarContent>
        <SimpleBar style={{ height: "100%" }}>
          <SidebarGroup className="flex items-center justify-center px-3 py-4 group-data-[state=collapsed]:px-2">
            <div className="flex w-full flex-col gap-4 px-0 group-data-[state=collapsed]:px-0">
              <NavCollapse menu={sidebaritems} className="text-sm" />
            </div>
          </SidebarGroup>
        </SimpleBar>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="hide-menu flex flex-col gap-2">
          <NavSecondary />
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
