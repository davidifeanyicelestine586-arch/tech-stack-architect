"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, CheckCircle2, Info, ArrowUpRight, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type IssueSeverity = "error" | "warning" | "info" | "suggestion";

const severityMeta: Record<IssueSeverity, { label: string; icon: typeof AlertTriangle; className: string }> = {
  error: { label: "Error", icon: XCircle, className: "border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400" },
  warning: { label: "Warning", icon: AlertTriangle, className: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400" },
  info: { label: "Info", icon: Info, className: "border-sky-500/20 bg-sky-500/5 text-sky-700 dark:text-sky-400" },
  suggestion: { label: "Suggestion", icon: ArrowUpRight, className: "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400" },
};

export function ValidationPanel() {
  const { validationReport, selectedComponents } = useTechStack();

  if (selectedComponents.length === 0) {
    return (
      <Card id="validation" className="overflow-hidden border-dashed bg-muted/20">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs font-bold">Step 5</Badge>
            <CardTitle className="text-sm font-bold">Compatibility Check</CardTitle>
          </div>
          <CardDescription className="pt-1 text-xs leading-relaxed">
            Your stack will be checked for dependencies, conflicts, and architecture rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div role="status" className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
            <Info aria-hidden="true" className="size-3.5 shrink-0" />
            Add technologies to unlock the compatibility result.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { score, status, warnings, suggestions, dependencyReport, conflictReport } = validationReport;
  const issues = [
    ...(dependencyReport?.missing || []).map((dependency) => ({ component: "Dependency", severity: "error" as const, message: `Missing required dependency: ${dependency}` })),
    ...(conflictReport?.componentConflicts || []).map((conflict) => ({ component: "Compatibility", severity: "error" as const, message: `${conflict.source} conflicts with ${conflict.target}: ${conflict.reason}` })),
    ...(conflictReport?.pinConflicts || []).map((conflict) => ({ component: "Hardware compatibility", severity: conflict.severity as IssueSeverity, message: `Pin ${conflict.pin} is shared by ${conflict.components.join(", ")}. ${conflict.recommendation}` })),
    ...(conflictReport?.ruleViolations || []).map((violation) => ({ component: violation.rule, severity: violation.severity as IssueSeverity, message: violation.message })),
    ...(warnings || []).map((warning) => ({ component: warning.component, severity: warning.severity as IssueSeverity, message: warning.message })),
  ];
  const isReady = issues.length === 0 && score >= 90;
  const getScoreColor = (s: number) => s >= 90 ? "text-emerald-600 dark:text-emerald-400" : s >= 70 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const getScoreBg = (s: number) => s >= 90 ? "bg-emerald-500/10" : s >= 70 ? "bg-amber-500/10" : "bg-rose-500/10";

  return (
    <Card id="validation" className={cn("overflow-hidden", isReady && "border-emerald-500/30")}>
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isReady ? <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-600 dark:text-emerald-400" /> : <ShieldCheck aria-hidden="true" className="size-4 text-primary" />}
              <Badge variant="outline" className="shrink-0 text-xs font-bold">Step 5</Badge>
              <CardTitle className="text-sm font-bold">Compatibility Check</CardTitle>
            </div>
            <CardDescription className="pt-1 text-xs">{isReady ? "Your selected technologies work together." : `${status}. Review these items before generating your blueprint.`}</CardDescription>
          </div>
          <div aria-label={`Compatibility score: ${score}%`} className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", getScoreBg(score), getScoreColor(score))}>{score}% match</div>
        </div>
      </CardHeader>

      {isReady ? (
        <CardContent className="flex flex-col gap-4 p-4">
          <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Architecture validated</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">No missing dependencies or conflicts were detected. Your stack is ready for the next step.</p>
              </div>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next step</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><ArrowUpRight aria-hidden="true" className="size-3.5 text-primary" /> Generate your Architecture Blueprint below.</div>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-5 p-4">
          <section aria-labelledby="validation-issues-heading" className="flex flex-col gap-2.5">
            <h4 id="validation-issues-heading" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground"><AlertTriangle aria-hidden="true" className="size-3" /> Issues &amp; Warnings ({issues.length})</h4>
            {issues.length > 0 ? (
              <div className="flex flex-col gap-2" role="list">
                {issues.map((item, idx) => {
                  const meta = severityMeta[item.severity] || severityMeta.info;
                  const Icon = meta.icon;
                  return (
                    <div key={`${item.component}-${idx}`} role="listitem" className={cn("flex flex-col gap-1 rounded-lg border p-3", meta.className)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase">{item.component}</span>
                        <Badge variant="outline" className="h-6 shrink-0 px-1.5 text-xs">{meta.label}</Badge>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                        <p className="text-xs leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 aria-hidden="true" className="size-3.5" /> No blocking compatibility issues detected.</div>
            )}
          </section>

          {suggestions && suggestions.length > 0 && (
            <section aria-labelledby="validation-suggestions-heading" className="flex flex-col gap-2.5">
              <h4 id="validation-suggestions-heading" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Info aria-hidden="true" className="size-3" /> Suggested improvements</h4>
              <div className="flex flex-col gap-2">{suggestions.map((suggestion, idx) => <div key={idx} className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-400"><ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /><p className="leading-relaxed">{suggestion}</p></div>)}</div>
            </section>
          )}
        </CardContent>
      )}
    </Card>
  );
}
