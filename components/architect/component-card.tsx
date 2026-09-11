"use client";

import React, { useState } from "react";
import type { Component } from "@/lib/types";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Plus, Info, Clock, Cpu, AlertTriangle } from "lucide-react";
import { ComponentDetailModal } from "./component-detail-modal";
import { formatPinGroups } from "./pin-display";

interface ComponentCardProps { component: Component; }

export function ComponentCard({ component }: ComponentCardProps) {
  const { selectedComponentIds, toggleComponent } = useTechStack();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSelected = selectedComponentIds.includes(component.id);
  const pinSummary = formatPinGroups(component.pins);

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case "Beginner": return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Beginner</span>;
      case "Intermediate": return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Intermediate</span>;
      case "Advanced": return <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">Advanced</span>;
      default: return null;
    }
  };

  return (
    <>
      <Card className={cn(
        "group relative flex flex-col justify-between transition-all duration-200",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/40"
          : "border-border bg-card hover:border-border/80 hover:shadow-md"
      )}>
        <CardHeader className="p-4 pb-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <Badge variant="outline" className="bg-muted/30 px-2 py-0 font-mono text-xs uppercase">{component.category}</Badge>
            <div className="flex items-center gap-1.5">
              {getDifficultyBadge(component.difficulty)}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
                title="View full specification"
                aria-label={`View ${component.name} details`}
              >
                <Info className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <CardTitle className="flex items-center justify-between text-sm font-bold text-foreground transition-colors group-hover:text-primary"><span>{component.name}</span></CardTitle>
          <p className="line-clamp-2 pt-1 text-xs leading-relaxed text-muted-foreground">{component.description}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 p-4 pt-2">
          <div className="flex min-h-[22px] flex-wrap items-center gap-1.5" aria-label="Component constraints and capabilities">
            {pinSummary && <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:text-emerald-400"><Cpu className="size-3" aria-hidden="true" /> {pinSummary}</span>}
            {component.requires && component.requires.length > 0 && <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Requires: {component.requires.slice(0, 2).join(", ")}{component.requires.length > 2 ? "..." : ""}</span>}
            {component.conflicts && component.conflicts.length > 0 && <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-600 dark:text-rose-400"><AlertTriangle className="size-3" aria-hidden="true" /> <span>Compatibility issue</span></span>}
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
            <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground"><Clock className="size-3" aria-hidden="true" /><span>~{component.estimatedLearningHours || 4}h to learn</span></div>
            <Button
              type="button"
              size="sm"
              onClick={() => toggleComponent(component.id)}
              variant={isSelected ? "default" : "outline"}
              aria-pressed={isSelected}
              aria-label={isSelected ? `Remove ${component.name} from stack` : `Add ${component.name} to stack`}
              className={cn(
                "min-h-11 gap-1 px-3 text-xs font-semibold transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  : "hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              )}
            >
              {isSelected ? <><Check className="size-3.5" aria-hidden="true" /><span>Selected</span></> : <><Plus className="size-3.5" aria-hidden="true" /><span>Add to Stack</span></>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ComponentDetailModal component={component} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
