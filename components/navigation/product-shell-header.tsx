"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
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
          <Image
            src="/brand/logo-full-light.png"
            alt=""
            width={940}
            height={320}
            sizes="(min-width: 640px) 150px, 124px"
            priority
            className="h-auto w-[124px] sm:w-[150px] dark:hidden"
          />
          <Image
            src="/brand/logo-full-dark.png"
            alt=""
            width={525}
            height={195}
            sizes="(min-width: 640px) 150px, 124px"
            priority
            className="hidden h-auto w-[124px] sm:w-[150px] dark:block"
          />
        </Link>
        <ProductPrimaryNav />
      </div>
      {workspaceControls ? (
        <div className="border-t border-border/70">{workspaceControls}</div>
      ) : null}
    </header>
  );
}
