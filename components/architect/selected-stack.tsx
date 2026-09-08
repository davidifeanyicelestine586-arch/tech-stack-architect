"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Layers, Trash2, Zap } from "lucide-react";

type SelectedStackProps = {
  variant?: "default" | "mobile";
};

export function SelectedStack({ variant = "default" }: SelectedStackProps) {
  const {
    selectedComponents,
    removeComponent,
    clearSelection,
    resolveMissingDependencies,
    validationReport,
  } = useTechStack();

  const missingCount = validationReport?.dependencyReport?.missing?.length || 0;
  const isValidated = Boolean(validationReport?.valid && validationReport.score >= 90);
  const isMobile = variant === "mobile";

  if (selectedComponents.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className={`flex flex-col items-center justify-center text-center ${isMobile ? "p-7" : "p-10 sm:p-12"}`}>
          <div className="mb-3 rounded-full bg-muted/60 p-3">
            <Layers className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Your stack is empty</h3>
          <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
            Add technologies from the browser to start building your architecture.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={isMobile ? undefined : "stack"} className="overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="text-sm font-bold">Your Stack</CardTitle>
            <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold">
              {selectedComponents.length} {selectedComponents.length === 1 ? "technology" : "technologies"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            onClick={clearSelection}
            className="min-h-11 shrink-0 px-2.5 text-[10px] text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 size-3.5" />
            Clear all
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className={isValidated ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
            {isValidated ? "✓ Compatibility checked" : "Ready for a compatibility check"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={`${isMobile ? "max-h-[240px]" : "max-h-[360px]"} divide-y divide-border/50 overflow-y-auto`}>
          {selectedComponents.map((comp) => (
            <div key={comp.id} className="group flex min-h-14 items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/30">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-xs font-bold text-foreground">{comp.name}</span>
                <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{comp.category}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${comp.name}`}
                title={`Remove ${comp.name}`}
                onClick={() => removeComponent(comp.id)}
                className="size-11 shrink-0 text-muted-foreground opacity-100 transition-opacity hover:text-destructive lg:opacity-0 lg:group-hover:opacity-100"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {missingCount > 0 && (
          <div className="border-t border-amber-500/20 bg-amber-500/10 p-3">
            <div className="mb-2 flex items-start gap-2">
              <Zap className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  Missing compatibility requirements
                </span>
                <p className="text-[10px] leading-tight text-amber-600/80 dark:text-amber-400/80">
                  {missingCount} required technology {missingCount === 1 ? "is" : "are"} missing from this stack.
                </p>
              </div>
            </div>
            <Button
              className="min-h-11 w-full text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700"
              onClick={resolveMissingDependencies}
            >
              Add missing technologies
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
