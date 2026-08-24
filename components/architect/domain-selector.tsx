"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Globe, Bot, Cpu, Sparkles, Layers } from "lucide-react";

export function DomainSelector() {
  const { domains, activeDomain, setActiveDomain, components } = useTechStack();

  const getDomainIcon = (id: string) => {
    switch (id) {
      case "web-saas":
        return <Globe className="w-4 h-4 text-sky-500" />;
      case "ai-automation":
        return <Bot className="w-4 h-4 text-indigo-500" />;
      case "mechatronics":
        return <Cpu className="w-4 h-4 text-emerald-500" />;
      default:
        return <Layers className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Engineering Tracks
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0">
            {domains.length} Tracks
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* All Domains Tab */}
        <button
          type="button"
          onClick={() => setActiveDomain("all")}
          className={cn(
            "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer",
            activeDomain === "all"
              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
              : "border-border bg-card/60 hover:bg-card hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-1.5 rounded-lg bg-background border border-border/60">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {components.length}
            </Badge>
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">All Domains</div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              Full cross-domain stack catalog
            </p>
          </div>
        </button>

        {/* Individual Domain Tabs */}
        {domains.map((dom) => {
          const count = components.filter((c) => c.domain === dom.id).length;
          const isActive = activeDomain === dom.id;

          return (
            <button
              key={dom.id}
              type="button"
              onClick={() => setActiveDomain(dom.id)}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer",
                isActive
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                  : "border-border bg-card/60 hover:bg-card hover:border-border/80"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-1.5 rounded-lg bg-background border border-border/60 flex items-center justify-center">
                  {getDomainIcon(dom.id)}
                </div>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="text-[10px] font-semibold"
                >
                  {count} Nodes
                </Badge>
              </div>
              <div className="w-full">
                <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{dom.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {dom.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
