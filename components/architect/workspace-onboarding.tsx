"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Circle, Sparkles, X } from "lucide-react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "tech-stack-architect:getting-started:dismissed:v1";

export function WorkspaceOnboarding() {
  const {
    projectDefinition,
    requirementAnalysis,
    selectedComponentIds,
    architecture,
    architectureValidation,
    validationReport,
    developmentPlan,
    blueprint,
    isArchitectureStale,
    isDevelopmentPlanStale,
  } = useTechStack();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let initialDismissed = false;
    try {
      initialDismissed = window.localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      initialDismissed = false;
    }
    queueMicrotask(() => {
      setDismissed(initialDismissed);
      setReady(true);
    });
  }, []);

  const hasDefinition = Boolean(
    projectDefinition.name.trim() &&
    projectDefinition.description.trim() &&
    projectDefinition.domain.trim()
  );
  const hasArchitecture = Boolean(architecture && !isArchitectureStale);
  const hasPlan = Boolean(developmentPlan && !isDevelopmentPlanStale);
  const hasBlueprint = Boolean(
    blueprint &&
    hasPlan &&
    JSON.stringify(blueprint.architecture ?? null) === JSON.stringify(architecture ?? null) &&
    JSON.stringify(blueprint.developmentPlan ?? null) === JSON.stringify(developmentPlan ?? null)
  );

  const tasks = useMemo(() => [
    { label: "Define your project", href: "#define", complete: hasDefinition },
    { label: "Analyze requirements", href: "#define", complete: Boolean(requirementAnalysis) },
    { label: "Review recommendations", href: "#recommendations", complete: Boolean(requirementAnalysis && selectedComponentIds.length > 0) },
    { label: "Build your technology stack", href: "#components", complete: selectedComponentIds.length > 0 },
    { label: "Design the architecture", href: "#architect", complete: hasArchitecture },
    { label: "Validate the decisions", href: "#validation", complete: Boolean(hasArchitecture && architectureValidation?.valid && validationReport.valid) },
    { label: "Create the development plan", href: "#plan", complete: hasPlan },
    { label: "Generate the blueprint", href: "#blueprint", complete: hasBlueprint },
  ], [hasDefinition, requirementAnalysis, selectedComponentIds.length, hasArchitecture, architectureValidation, validationReport.valid, hasPlan, hasBlueprint]);

  const completedCount = tasks.filter((task) => task.complete).length;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // The guide remains dismissible for this session when storage is unavailable.
    }
  };

  const reopen = () => {
    setDismissed(false);
    try {
      window.localStorage.removeItem(DISMISS_KEY);
    } catch {
      // The guide can still be reopened for this session.
    }
  };

  if (!ready) return null;

  if (dismissed) {
    return (
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reopen} aria-label="Show getting-started guide">
          <Sparkles className="mr-2 size-4" aria-hidden="true" />
          Show getting-started guide
        </Button>
      </div>
    );
  }

  return (
    <section aria-label="Getting started" className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your first project</p>
            <h2 className="mt-1 text-base font-bold tracking-tight text-foreground sm:text-lg">Welcome to Tech Stack Architect</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Start with your idea. We’ll guide you through technology choices, architecture, validation, and a practical development blueprint. Your progress stays in this workspace as you move between stages.
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onClick={dismiss} aria-label="Dismiss getting-started guide">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-foreground">Your progress</span>
            <span className="tabular-nums text-muted-foreground">{completedCount} of {tasks.length} complete</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Getting started progress"
            aria-valuemin={0}
            aria-valuemax={tasks.length}
            aria-valuenow={completedCount}
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(completedCount / tasks.length) * 100}%` }} />
          </div>
        </div>
        {!hasDefinition ? (
          <Button nativeButton={false} className="h-10 shrink-0" render={<Link href="/app#define" />}>
            Create your project <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {tasks.map((task, index) => (
          <li key={task.label}>
            <Link
              href={task.href}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{index + 1}.</span>
              {task.complete ? (
                <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">{task.label}</span>
              <span className="sr-only">{task.complete ? "Complete" : "Not complete"}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
