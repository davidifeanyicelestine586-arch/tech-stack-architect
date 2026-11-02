"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { ProductPrimaryNav } from "./product-primary-nav";

type ProductShellHeaderProps = {
  workspaceControls?: ReactNode;
};

export function ProductShellHeader({ workspaceControls }: ProductShellHeaderProps) {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-border/70 bg-background/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-nowrap items-center justify-between gap-x-3 px-4 py-3 sm:gap-x-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-md font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Ediccrew Tech Stack Architect home"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm sm:text-base">Tech Stack Architect</span>
            <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
              by Ediccrew
            </span>
          </span>
        </Link>
        <ProductPrimaryNav />
      </div>
      {workspaceControls ? (
        <div className="border-t border-border/70">{workspaceControls}</div>
      ) : null}
    </header>
  );
}
