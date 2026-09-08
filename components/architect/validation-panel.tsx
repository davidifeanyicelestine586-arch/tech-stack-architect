"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, CheckCircle2, Info, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ValidationPanel() {
  const { validationReport, selectedComponents } = useTechStack();

  if (selectedComponents.length === 0) {
    return (
      <Card id="validation" className="overflow-hidden border-dashed bg-muted/20">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <Badge variant="outline" className="text-[10px] font-bold">Step 5</Badge>
            <CardTitle className="text-sm font-bold">Compatibility Check</CardTitle>
          </div>
          <CardDescription className="pt-1 text-[11px] leading-relaxed">
            Your stack will be checked for dependencies, conflicts, and architecture rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-[11px] text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Add technologies to unlock the compatibility result.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { score, status, warnings, suggestions, dependencyReport, conflictReport } = validationReport;
  const issues = [
    ...(dependencyReport?.missing || []).map((dependency) => ({ component: "Dependency", severity: "error", message: `Missing required dependency: ${dependency}` })),
    ...(conflictReport?.componentConflicts || []).map((conflict) => ({ component: "Compatibility", severity: "error", message: `${conflict.source} conflicts with ${conflict.target}: ${conflict.reason}` })),
    ...(conflictReport?.pinConflicts || []).map((conflict) => ({ component: "Hardware compatibility", severity: conflict.severity, message: `Pin ${conflict.pin} is shared by ${conflict.components.join(", ")}. ${conflict.recommendation}` })),
    ...(conflictReport?.ruleViolations || []).map((violation) => ({ component: violation.rule, severity: violation.severity, message: violation.message })),
    ...(warnings || []),
  ];
  const isReady = issues.length === 0 && score >= 90;
  const getScoreColor = (s: number) => s >= 90 ? "text-emerald-600 dark:text-emerald-400" : s >= 70 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const getScoreBg = (s: number) => s >= 90 ? "bg-emerald-500/10" : s >= 70 ? "bg-amber-500/10" : "bg-rose-500/10";

  return (
    <Card id="validation" className={cn("overflow-hidden", isReady && "border-emerald-500/30") }>
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {isReady ? <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> : <ShieldCheck className="size-4 text-primary" />}
              <Badge variant="outline" className="text-[10px] font-bold">Step 5</Badge>
              <CardTitle className="text-sm font-bold">Compatibility Check</CardTitle>
            </div>
            <CardDescription className="pt-1 text-[11px]">{isReady ? "Your selected technologies work together." : "Review these items before generating your blueprint."}</CardDescription>
          </div>
          <div className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", getScoreBg(score), getScoreColor(score))}>{score}% match</div>
        </div>
      </CardHeader>

      {isReady ? (
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Architecture validated</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">No missing dependencies or conflicts were detected. Your stack is ready for the next step.</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next step</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><ArrowUpRight className="size-3.5 text-primary" /> Generate your Architecture Blueprint below.</div>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-2.5">
            <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><AlertTriangle className="size-3" /> Issues & Warnings ({issues.length})</h4>
            {issues.length > 0 ? (
              <div className="flex flex-col gap-2">
                {issues.map((warn, idx) => (
                  <div key={idx} className="flex flex-col gap-1 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
                    <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">{warn.component}</span><Badge variant="outline" className="h-4 border-rose-500/30 px-1 text-[8px] text-rose-600">{warn.severity}</Badge></div>
                    <p className="text-[11px] leading-tight text-rose-600/90 dark:text-rose-400/90">{warn.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"><CheckCircle2 className="size-3.5 text-emerald-600" /><span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">No blocking compatibility issues detected.</span></div>
            )}
          </div>

          {suggestions && suggestions.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><Info className="size-3" /> Suggested improvements</h4>
              <div className="flex flex-col gap-2">{suggestions.map((sug, idx) => <div key={idx} className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5"><ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-blue-600" /><p className="text-[11px] leading-tight text-blue-700 dark:text-blue-400">{sug}</p></div>)}</div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
