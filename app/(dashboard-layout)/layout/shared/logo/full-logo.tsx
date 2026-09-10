"use client";

import React from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

const FullLogo = () => {
  return (
    <Link
      href="/"
      aria-label="Ediccrew Tech Stack Architect home"
      className="group flex select-none items-center gap-2.5 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <Layers aria-hidden="true" className="h-4 w-4" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight text-foreground">EDICCREW</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Stack Architect</span>
      </div>
    </Link>
  );
};

export default FullLogo;
