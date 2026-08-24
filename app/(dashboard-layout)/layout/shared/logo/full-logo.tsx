"use client";

import React from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

const FullLogo = () => {
  return (
    <Link href="/" className="flex items-center gap-2.5 group select-none">
      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
        <Layers className="w-4 h-4" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-bold text-base tracking-tight text-foreground">
          EDICCREW
        </span>
        <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
          Stack Architect
        </span>
      </div>
    </Link>
  );
};

export default FullLogo;