"use client";

import { ShieldCheck } from "lucide-react";
import componentsData from "@/data/components.json";
import domainsData from "@/data/domain.json";
import recipesData from "@/data/recipes.json";

export function NavSecondary() {
  return (
    <div className="-mx-1 rounded-lg border border-border bg-card/60 p-3 shadow-xs">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Engine Status</span>
          </div>
          <span className="inline-flex rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
            Online
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 border-t border-border/50 pt-1 text-center text-[11px]">
          <div>
            <div className="font-bold text-neutral-900 dark:text-neutral-100">{domainsData.length}</div>
            <div className="text-[11px] text-neutral-700 dark:text-neutral-300">Domains</div>
          </div>
          <div>
            <div className="font-bold text-neutral-900 dark:text-neutral-100">{componentsData.length}</div>
            <div className="text-[11px] text-neutral-700 dark:text-neutral-300">Nodes</div>
          </div>
          <div>
            <div className="font-bold text-neutral-900 dark:text-neutral-100">{recipesData.length}</div>
            <div className="text-[11px] text-neutral-700 dark:text-neutral-300">Recipes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
