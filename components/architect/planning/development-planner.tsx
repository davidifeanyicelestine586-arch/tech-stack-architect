"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import type { DevelopmentTask } from "@/lib/types";

export function DevelopmentPlanner() {
  const [error, setError] = useState("");
  const {
    architecture,
    developmentPlan,
    setDevelopmentPlan,
    generateDevelopmentPlan,
    architectureValidation,
    validationReport,
    isArchitectureStale,
    isDevelopmentPlanStale,
  } = useTechStack();
  const canGenerate = Boolean(architecture && !isArchitectureStale && architectureValidation?.valid && validationReport.valid);
  const updateTask = (taskId: string, patch: Partial<DevelopmentTask>) => {
    if (!developmentPlan) return;
    setDevelopmentPlan({
      ...developmentPlan,
      tasks: developmentPlan.tasks.map((task) => task.id === taskId ? { ...task, ...patch } : task),
    });
  };
  const handleGenerate = () => {
    if (developmentPlan && !window.confirm("Regenerating replaces the current roadmap and any task edits. Continue?")) return;
    try {
      setError("");
      generateDevelopmentPlan();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The development plan could not be generated.");
    }
  };

  return (
    <section aria-labelledby="development-plan-heading" className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Development planning</p>
        <h2 id="development-plan-heading" className="mt-1 text-lg font-bold tracking-tight text-foreground">Turn the architecture into an actionable roadmap</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">The plan is derived from your reviewed architecture. It includes phases, milestones, task dependencies, deliverables, acceptance criteria, and suggested tests. It deliberately avoids invented dates or effort estimates.</p>
      </div>

      {!architecture ? (
        <Card className="border-dashed bg-muted/20"><CardContent className="flex min-h-24 items-center gap-3 p-5"><ListTodo className="size-5 text-muted-foreground" aria-hidden="true" /><div><p className="text-sm font-semibold text-foreground">Architecture is required first</p><p className="mt-1 text-xs text-muted-foreground">Generate and review an architecture before creating development tasks.</p></div></CardContent></Card>
      ) : isArchitectureStale ? (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" /><span>Your architecture is out of date. Regenerate or review it before creating a development plan.</span></div>
      ) : !validationReport.valid ? (
        <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-foreground">Resolve the stack compatibility findings before generating development tasks.</div>
      ) : architectureValidation && !architectureValidation.valid ? (
        <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-foreground">Resolve architecture validation errors before generating development tasks.</div>
      ) : null}

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4" aria-hidden="true" /> Dependency-ordered plan · no fabricated schedule</div>
        <Button type="button" onClick={handleGenerate} disabled={!canGenerate}>
          {developmentPlan ? "Regenerate development plan" : "Generate development plan"}
        </Button>
      </div>

      {developmentPlan ? (
        <>
          {isDevelopmentPlanStale ? <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-foreground">This plan no longer matches the current project or architecture. Regenerate it to refresh the tasks. Existing task edits remain available until you choose to regenerate.</div> : <Badge variant="secondary" className="w-fit"><CheckCircle2 className="mr-1 size-3.5" aria-hidden="true" /> Plan generated</Badge>}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {developmentPlan.milestones.map((milestone) => (
              <Card key={milestone.id} className="bg-muted/20">
                <CardHeader className="pb-2"><CardTitle className="text-xs">{milestone.title}</CardTitle><CardDescription className="text-xs">{milestone.description}</CardDescription></CardHeader>
                <CardContent><ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">{milestone.completionCriteria.map((item) => <li key={item}>{item}</li>)}</ul></CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {developmentPlan.phases.map((phase, index) => {
              const phaseTasks = developmentPlan.tasks.filter((task) => phase.taskIds.includes(task.id));
              return (
                <Card key={phase.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Phase {index + 1}</Badge><CardTitle className="text-sm">{phase.title}</CardTitle></div>
                    <CardDescription className="text-xs">{phase.objective}</CardDescription>
                    {phase.dependsOn.length ? <p className="text-[11px] text-muted-foreground">Depends on: {phase.dependsOn.join(", ")}</p> : null}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {phaseTasks.map((task) => (
                      <details key={task.id} className="group rounded-lg border border-border p-3">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">{task.title}<span className="ml-2 text-xs font-normal text-muted-foreground">{task.componentIds.length ? `· ${task.componentIds.length} architecture component(s)` : "· Project task"}</span></summary>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <label className="text-[11px] font-semibold text-muted-foreground">Task title<input className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground" value={task.title} onChange={(event) => updateTask(task.id, { title: event.target.value })} /></label>
                          <label className="text-[11px] font-semibold text-muted-foreground">Description<textarea className="mt-1 min-h-16 w-full rounded-md border border-input bg-background p-2 text-xs text-foreground" value={task.description} onChange={(event) => updateTask(task.id, { description: event.target.value })} /></label>
                        </div>
                        {task.dependsOn.length ? <p className="mt-2 text-xs text-muted-foreground">Prerequisites: {task.dependsOn.join(", ")}</p> : null}
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div><p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Acceptance criteria</p><ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-foreground">{task.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}</ul></div>
                          <div><p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Deliverables</p><ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-foreground">{task.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
                        </div>
                        {task.suggestedTests.length ? <div className="mt-3"><p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Suggested tests</p><ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-foreground">{task.suggestedTests.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                        {task.learningResources.length ? <p className="mt-3 text-xs text-muted-foreground">Learning: {task.learningResources.join(" · ")}</p> : null}
                      </details>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
