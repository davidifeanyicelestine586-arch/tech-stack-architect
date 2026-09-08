"use client";

import Link from "next/link";
import { Check, ChevronRight, Circle } from "lucide-react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Badge } from "@/components/ui/badge";

const steps = [
  { id: "define", label: "Define", href: "#define" },
  { id: "analyze", label: "Analyze", href: "#recommendations" },
  { id: "review", label: "Review", href: "#recommendations" },
  { id: "build", label: "Build", href: "#components" },
  { id: "validate", label: "Validate", href: "#validation" },
  { id: "blueprint", label: "Blueprint", href: "#blueprint" },
] as const;

export function WorkflowProgress() {
  const { projectDefinition, requirementAnalysis, selectedComponentIds, validationReport, blueprint } = useTechStack();
  const hasProject = Boolean(projectDefinition.name.trim() || projectDefinition.description.trim() || projectDefinition.requirements.trim());
  const hasRecommendations = Boolean(requirementAnalysis);
  const hasStack = selectedComponentIds.length > 0;
  const hasBlueprint = Boolean(blueprint);

  const completed = [
    hasProject,
    hasRecommendations,
    hasRecommendations,
    hasStack,
    hasStack && Boolean(validationReport),
    hasBlueprint,
  ];
  const activeIndex = hasBlueprint ? 5 : hasStack ? 4 : hasRecommendations ? 2 : hasProject ? 1 : 0;

  return (
    <section aria-label="Architecture progress" className="rounded-xl border border-border bg-card p-3 shadow-xs md:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-foreground">Your architecture journey</p>
          <p className="text-[11px] text-muted-foreground">Complete one step at a time. You can always go back and adjust.</p>
        </div>
        <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">Step {activeIndex + 1} of 6</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((step, index) => {
          const isDone = completed[index] && index < activeIndex;
          const isActive = index === activeIndex;
          return (
            <Link
              key={step.id}
              href={step.href}
              aria-current={isActive ? "step" : undefined}
              className={`group flex min-h-11 items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
                isActive ? "border-primary/30 bg-primary/10 text-primary" : isDone ? "border-border bg-muted/40 text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50"
              }`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold">
                {isDone ? <Check className="size-3.5" /> : isActive ? <ChevronRight className="size-3.5" /> : <Circle className="size-2.5" />}
              </span>
              <span className="text-xs font-semibold">{step.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
