"use client";

import React from "react";
import type { Component } from "@/lib/types";
import { useTechStack } from "@/hooks/use-tech-stack";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Plus,
  Clock,
  Layers,
  Cpu,
  ShieldAlert,
  Code2,
} from "lucide-react";
import { getPinGroups } from "./pin-display";

interface ComponentDetailModalProps {
  component: Component | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ComponentDetailModal({
  component,
  isOpen,
  onClose,
}: ComponentDetailModalProps) {
  const { selectedComponentIds, toggleComponent } = useTechStack();

  if (!component) return null;

  const isSelected = selectedComponentIds.includes(component.id);
  const pinGroups = getPinGroups(component.pins);

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case "Beginner":
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Beginner</Badge>;
      case "Intermediate":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Intermediate</Badge>;
      case "Advanced":
        return <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">Advanced</Badge>;
      default:
        return <Badge variant="secondary">{diff || "Standard"}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader className="gap-2 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">
                {component.category}
              </Badge>
              {getDifficultyBadge(component.difficulty)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>~{component.estimatedLearningHours || 4}h learning</span>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-foreground flex items-center justify-between pt-1">
            <span>{component.name}</span>
          </DialogTitle>

          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {component.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-3">
          {/* Complexity Indicator */}
          {component.complexity && (
            <div className="flex items-center justify-between text-xs bg-muted/40 p-3 rounded-lg border border-border/50">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> Complexity Rating
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    className={`w-2.5 h-2.5 rounded-full ${
                      level <= (component.complexity || 1)
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
                <span className="ml-2 font-mono font-bold text-foreground">
                  {component.complexity}/5
                </span>
              </div>
            </div>
          )}

          {/* Requires / Dependencies */}
          {component.requires && component.requires.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Required Dependencies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {component.requires.map((req) => (
                  <Badge
                    key={req}
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-1"
                  >
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Optional Enhancements */}
          {component.optional && component.optional.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Optional Integrations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {component.optional.map((opt) => (
                  <Badge
                    key={opt}
                    variant="secondary"
                    className="text-xs text-muted-foreground px-2 py-0.5"
                  >
                    {opt}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Hardware Pin Specifications */}
          {(pinGroups.length > 0 || component.pinsRequired || component.pinsProvided) && (
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> Hardware Pin Assignments
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {pinGroups.map(({ label, values }) => (
                  <div key={label}>
                    <span className="text-muted-foreground">{label}: </span>
                    <strong className="font-mono text-foreground">{values.join(", ")}</strong>
                  </div>
                ))}
                {component.pinsRequired && (
                  <div>
                    <span className="text-muted-foreground">Required Pins: </span>
                    <strong className="font-mono text-amber-600 dark:text-amber-400">{component.pinsRequired.join(", ")}</strong>
                  </div>
                )}
                {component.pinsProvided && (
                  <div>
                    <span className="text-muted-foreground">Provided Channels: </span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">{component.pinsProvided.join(", ")}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conflicts & Anti-patterns */}
          {component.conflicts && component.conflicts.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Incompatibilities & Conflicts
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {component.conflicts.map((conf, idx) => {
                  const confText = typeof conf === "string" ? conf : `${conf.component}: ${conf.reason || ""}`;
                  return (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs"
                    >
                      {confText}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expected Outputs */}
          {component.outputs && component.outputs.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Synthesized Deliverables
              </span>
              <div className="flex flex-wrap gap-1.5">
                {component.outputs.map((out) => (
                  <span
                    key={out}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground font-mono"
                  >
                    <Code2 className="w-3 h-3 text-muted-foreground" />
                    {out}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {component.tags && component.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
              {component.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              toggleComponent(component.id);
            }}
            className={
              isSelected
                ? "bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                : "bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            }
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" />
                <span>Remove from Stack</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to Stack</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
