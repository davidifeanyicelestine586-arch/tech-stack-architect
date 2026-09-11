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
        return <Globe className="size-4 text-sky-500" aria-hidden="true" />;
      case "ai-automation":
        return <Bot className="size-4 text-indigo-500" aria-hidden="true" />;
      case "mechatronics":
        return <Cpu className="size-4 text-emerald-500" aria-hidden="true" />;
      default:
        return <Layers className="size-4 text-primary" aria-hidden="true" />;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project Type
          </span>
          <Badge variant="outline" className="px-2 py-0 text-xs font-mono">
            {domains.length} Types
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="group" aria-label="Project type">
        <button
          type="button"
          onClick={() => setActiveDomain("all")}
          aria-pressed={activeDomain === "all"}
          className={cn(
            "flex min-h-11 cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]",
            activeDomain === "all"
              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
              : "border-border bg-card/60 hover:border-border/80 hover:bg-card"
          )}
        >
          <div className="flex w-full items-center justify-between">
            <div className="rounded-lg border border-border/60 bg-background p-1.5">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
            </div>
            <Badge variant="secondary" className="text-xs font-semibold">
              {components.length}
            </Badge>
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">All Project Types</div>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              Browse the full technology catalog
            </p>
          </div>
        </button>

        {domains.map((dom) => {
          const count = components.filter((c) => c.domain === dom.id).length;
          const isActive = activeDomain === dom.id;

          return (
            <button
              key={dom.id}
              id={`domain-${dom.id}`}
              type="button"
              onClick={() => setActiveDomain(dom.id)}
              aria-pressed={isActive}
              aria-label={`${dom.title}: ${count} technologies`}
              className={cn(
                "group relative flex min-h-11 cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]",
                isActive
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                  : "border-border bg-card/60 hover:border-border/80 hover:bg-card"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center justify-center rounded-lg border border-border/60 bg-background p-1.5">
                  {getDomainIcon(dom.id)}
                </div>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="text-xs font-semibold"
                  aria-hidden="true"
                >
                  {count} Technologies
                </Badge>
              </div>
              <div className="w-full">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                  <span>{dom.title}</span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
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
