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

interface ComponentCardProps {
  component: Component;
}

export function ComponentCard({ component }: ComponentCardProps) {
  const { selectedComponentIds, toggleComponent } = useTechStack();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSelected = selectedComponentIds.includes(component.id);
  const pinSummary = formatPinGroups(component.pins);

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case "Beginner":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Beginner
          </span>
        );
      case "Intermediate":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            Intermediate
          </span>
        );
      case "Advanced":
        return (
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
            Advanced
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group relative flex flex-col justify-between transition-all duration-200 hover:shadow-md",
          isSelected
            ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/40"
            : "border-border bg-card hover:border-border/80"
        )}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Badge
              variant="outline"
              className="text-[10px] font-mono uppercase px-2 py-0 bg-muted/30"
            >
              {component.category}
            </Badge>
            <div className="flex items-center gap-1.5">
              {getDifficultyBadge(component.difficulty)}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                title="View full specification"
                aria-label={`View ${component.name} details`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <CardTitle className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
            <span>{component.name}</span>
          </CardTitle>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
            {component.description}
          </p>
        </CardHeader>

        <CardContent className="p-4 pt-2 flex flex-col gap-3">
          {/* Hardware Pin or Requirements info */}
          <div className="flex flex-wrap items-center gap-1.5 min-h-[22px]">
            {pinSummary && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <Cpu className="w-3 h-3" /> {pinSummary}
              </span>
            )}
            {component.requires && component.requires.length > 0 && (
              <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Requires: {component.requires.slice(0, 2).join(", ")}
                {component.requires.length > 2 ? "..." : ""}
              </span>
            )}
            {component.conflicts && component.conflicts.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" /> Conflicts
              </span>
            )}
          </div>

          {/* Action button & Learning time */}
          <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span>~{component.estimatedLearningHours || 4}h</span>
            </div>

            <Button
              size="sm"
              onClick={() => toggleComponent(component.id)}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-7 px-2.5 text-xs font-semibold gap-1 transition-all cursor-pointer",
                isSelected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                  : "hover:bg-primary/10 hover:text-primary hover:border-primary/40"
              )}
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Selected</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Node</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ComponentDetailModal
        component={component}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
