"use client";

import { Activity, ShieldCheck } from "lucide-react";

export function NavSecondary() {
  return (
    <div className="-mx-1 border border-border rounded-lg bg-card/60 p-3 shadow-xs">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Engine Status</span>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Online
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-border/50 text-[11px]">
          <div>
            <div className="font-bold text-foreground">3</div>
            <div className="text-[9px] text-muted-foreground">Domains</div>
          </div>
          <div>
            <div className="font-bold text-foreground">9+</div>
            <div className="text-[9px] text-muted-foreground">Nodes</div>
          </div>
          <div>
            <div className="font-bold text-foreground">5</div>
            <div className="text-[9px] text-muted-foreground">Recipes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
