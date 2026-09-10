"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { ChildItem } from "../sidebaritems";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  item: ChildItem;
  hasChildren: boolean;
  className?: string;
  isActive?: boolean;
}

export default function NavItem({
  item,
  hasChildren,
  className,
  isActive,
}: NavItemProps) {
  return (
    <motion.div
      className={cn(
        "group relative flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-200",
        "hover:bg-primary/5 hover:text-primary",
        "focus-within:bg-primary/5 focus-within:text-primary",
        "active:bg-primary/10",
        isActive && "bg-primary text-background font-medium hover:bg-primary hover:text-background",
        className,
      )}
      whileTap={{ scale: 0.985 }}
    >
      <span className="relative flex w-full items-center gap-2 rounded-md">
        {item.icon && <item.icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${item.color ?? ""}`} />}

        <span className="hide-menu font-medium">{item.name}</span>

        {item.badge && (
          <span
            className={`ms-auto hide-menu rounded-full px-2 py-0.5 text-xs ${
              item.badgeType === "filled"
                ? "bg-primary text-white dark:text-black"
                : "border border-primary text-primary"
            }`}
          >
            {item.badgeContent}
          </span>
        )}

        {item.isPro && (
          <Badge className="ms-auto hide-menu h-auto! rounded-md bg-primary! px-1.5 py-0.5 text-[10px]! text-background!">
            Pro
          </Badge>
        )}

        {hasChildren && (
          <ChevronRight
            aria-hidden="true"
            className="ms-auto h-4 w-4 transition-transform duration-200 group-open/nav:rotate-90 hide-menu"
          />
        )}
      </span>
    </motion.div>
  );
}
