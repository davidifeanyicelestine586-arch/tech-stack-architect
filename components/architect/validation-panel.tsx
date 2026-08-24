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
      <Card id="validation" className="overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">Validation Report</CardTitle>
          </div>
          <CardDescription className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pt-1">
            Status: <span className="text-muted-foreground">No Stack</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Select technology nodes to generate dependency, conflict, and readiness results.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { score, status, warnings, suggestions, dependencyReport, conflictReport } = validationReport;
  const issues = [
    ...(dependencyReport?.missing || []).map((dependency) => ({
      component: "Dependency",
      severity: "error",
      message: `Missing required dependency: ${dependency}`,
    })),
    ...(conflictReport?.componentConflicts || []).map((conflict) => ({
      component: "Component Conflict",
      severity: "error",
      message: `${conflict.source} conflicts with ${conflict.target}: ${conflict.reason}`,
    })),
    ...(conflictReport?.pinConflicts || []).map((conflict) => ({
      component: "Hardware Pin Conflict",
      severity: conflict.severity,
      message: `Pin ${conflict.pin} is shared by ${conflict.components.join(", ")}. ${conflict.recommendation}`,
    })),
    ...(conflictReport?.ruleViolations || []).map((violation) => ({
      component: violation.rule,
      severity: violation.severity,
      message: violation.message,
    })),
    ...(warnings || []),
  ];

  const getScoreColor = (s: number) => {
    if (s >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (s >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return "bg-emerald-500/10";
    if (s >= 70) return "bg-amber-500/10";
    return "bg-rose-500/10";
  };

  return (
    <Card id="validation" className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">Validation Report</CardTitle>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs", getScoreBg(score), getScoreColor(score))}>
            {score}% Match
          </div>
        </div>
        <CardDescription className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pt-1">
          Status: <span className={getScoreColor(score)}>{status}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 flex flex-col gap-5">
        {/* Warnings Section */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Issues & Warnings ({issues.length})
          </h4>
          {issues.length > 0 ? (
            <div className="flex flex-col gap-2">
              {issues.map((warn, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">{warn.component}</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 border-rose-500/30 text-rose-600">
                      {warn.severity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 leading-tight">
                    {warn.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">No missing dependencies or conflicts detected.</span>
            </div>
          )}
        </div>

        {/* Suggestions Section */}
        {suggestions && suggestions.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Recommended Enhancements
            </h4>
            <div className="flex flex-col gap-2">
              {suggestions.map((sug, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 flex items-start gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-tight">
                    {sug}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
