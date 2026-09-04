"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Layers, Trash2, Zap } from "lucide-react";

export function SelectedStack() {
  const {
    selectedComponents,
    removeComponent,
    clearSelection,
    resolveMissingDependencies,
    validationReport,
  } = useTechStack();

  const missingCount = validationReport?.dependencyReport?.missing?.length || 0;

  if (selectedComponents.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="p-3 rounded-full bg-muted/60 mb-3">
            <Layers className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Your stack is empty</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Add technology nodes from the browser to start building your architecture.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="stack" className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold">Selected Stack</CardTitle>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {selectedComponents.length} Nodes
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-7 text-[10px] text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
          {selectedComponents.map((comp) => (
            <div key={comp.id} className="p-3 flex items-center justify-between group hover:bg-muted/30 transition-colors">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-bold text-foreground truncate">{comp.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{comp.category}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${comp.name}`}
                title={`Remove ${comp.name}`}
                onClick={() => removeComponent(comp.id)}
                className="shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {missingCount > 0 && (
          <div className="p-3 bg-amber-500/10 border-t border-amber-500/20">
            <div className="flex items-start gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  Missing Required Dependencies
                </span>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 leading-tight">
                  This stack is missing {missingCount} required dependency nodes.
                </p>
              </div>
            </div>
            <Button
              className="w-full h-7 text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
              onClick={resolveMissingDependencies}
            >
              Add Missing Dependencies
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
