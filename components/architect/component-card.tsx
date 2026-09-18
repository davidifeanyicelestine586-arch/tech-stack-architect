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

  const difficultyClass = {
    Beginner: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Intermediate: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Advanced: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  } as const;

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
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="bg-muted/30 px-2 py-0 font-mono text-xs uppercase">
                {component.category}
              </Badge>
              {component.difficulty && (
                <Badge
                  variant="outline"
                  className={cn("px-2 py-0 text-xs font-semibold", difficultyClass[component.difficulty])}
                >
                  {component.difficulty}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
              title="View full specification"
              aria-label={`View ${component.name} details`}
            >
              <Info className="size-4" aria-hidden="true" />
            </button>
          </div>

          <CardTitle className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
            {component.name}
          </CardTitle>
          <p className="line-clamp-2 pt-1 text-xs leading-relaxed text-muted-foreground">
            {component.description}
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 p-4 pt-2">
          {(pinSummary || (component.requires && component.requires.length > 0) || (component.conflicts && component.conflicts.length > 0)) && (
            <div className="grid gap-1.5 text-xs" aria-label="Component constraints and capabilities">
              {pinSummary && (
                <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Cpu className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-mono">{pinSummary}</span>
                </div>
              )}
              {component.requires && component.requires.length > 0 && (
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Requires:</span>{" "}
                  {component.requires.slice(0, 2).join(", ")}
                  {component.requires.length > 2 ? "…" : ""}
                </div>
              )}
              {component.conflicts && component.conflicts.length > 0 && (
                <div className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>Compatibility issue — review before adding</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex min-h-11 items-center gap-1.5 rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`View ${component.name} specification`}
            >
              <Clock className="size-3.5" aria-hidden="true" />
              <span>~{component.estimatedLearningHours || 4}h learning</span>
            </button>

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
