"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode2, Download, Copy, Terminal, CheckCircle2, BookOpen, AlertCircle, RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function BlueprintPanel() {
  const { blueprint, projectDefinition, generateCustomBlueprint, selectedComponents, copyBlueprint, downloadBlueprint } = useTechStack();
  const [copiedJson, setCopiedJson] = React.useState(false);
  const [copiedMd, setCopiedMd] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [copyError, setCopyError] = React.useState("");

  const selectedComponentSignature = React.useMemo(() => JSON.stringify(selectedComponents.map((component) => component.id).sort()), [selectedComponents]);
  const blueprintComponentSignature = React.useMemo(() => JSON.stringify((blueprint?.components ?? []).map((component) => component.id).sort()), [blueprint]);
  const hasProjectContent = Boolean(projectDefinition.name.trim() || projectDefinition.description.trim() || projectDefinition.requirements.trim());
  const currentProjectSignature = JSON.stringify({ name: projectDefinition.name.trim(), description: projectDefinition.description.trim(), domain: projectDefinition.domain, difficulty: projectDefinition.difficulty, requirements: projectDefinition.requirements.trim() });
  const blueprintProject = blueprint?.project;
  const blueprintProjectSignature = JSON.stringify(blueprintProject ? { name: blueprintProject.name?.trim() ?? "", description: blueprintProject.description?.trim() ?? "", domain: blueprintProject.domain ?? blueprint?.domain ?? "", difficulty: blueprintProject.difficulty ?? projectDefinition.difficulty, requirements: blueprintProject.requirements?.trim() ?? "" } : hasProjectContent ? { missingProject: true } : { name: "", description: "", domain: projectDefinition.domain, difficulty: projectDefinition.difficulty, requirements: "" });
  const blueprintIsStale = Boolean(blueprint && (selectedComponentSignature !== blueprintComponentSignature || currentProjectSignature !== blueprintProjectSignature));

  const handleGenerate = async () => {
    if (isGenerating || selectedComponents.length === 0) return;
    setIsGenerating(true); setCopyError("");
    try { await Promise.resolve(generateCustomBlueprint()); } finally { setIsGenerating(false); }
  };

  if (selectedComponents.length === 0) {
    return <div id="blueprint" className="flex flex-col gap-4"><Card id="exports" className="border-dashed bg-muted/20"><CardContent className="flex flex-col items-center justify-center p-8 text-center"><FileCode2 className="mb-3 size-6 text-muted-foreground" /><h3 className="text-sm font-semibold text-foreground">Architecture Blueprint</h3><p className="mt-1 max-w-sm text-xs text-muted-foreground">Your blueprint appears here after you build a technology stack and run the compatibility check.</p></CardContent></Card></div>;
  }

  const handleCopy = async (format: "json" | "markdown") => {
    setCopyError(""); const success = await copyBlueprint(format);
    if (success) { if (format === "json") { setCopiedJson(true); setTimeout(() => setCopiedJson(false), 2000); } else { setCopiedMd(true); setTimeout(() => setCopiedMd(false), 2000); } }
    else setCopyError("Copy was blocked by the browser. Use the download action instead.");
  };

  const project = blueprint?.project || (projectDefinition.name || projectDefinition.description ? projectDefinition : null);

  if (!blueprint) {
    return <div id="blueprint" className="flex flex-col gap-4"><Card id="exports" className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card"><CardContent className="flex flex-col items-center justify-center p-10 text-center"><div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Terminal className="size-6" /></div><Badge variant="outline" className="mb-2 border-primary/30 text-[10px] text-primary">Step 6 · Finalize</Badge><h3 className="text-lg font-bold text-foreground">Generate your Architecture Blueprint</h3><p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">Your stack is assembled. Turn it into a development-ready blueprint with project context, learning goals, starter commands, and validation results.</p><Button className="mt-6 min-h-11 gap-2 px-5 text-xs" onClick={handleGenerate} disabled={isGenerating}><Terminal className="size-3.5" />{isGenerating ? "Generating Blueprint…" : "Generate Architecture Blueprint"}</Button></CardContent></Card></div>;
  }

  return (
    <div id="blueprint" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div><div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /><h3 className="text-sm font-bold">Architecture Blueprint</h3></div><p className="mt-1 text-[11px] text-muted-foreground">Your validated stack, translated into an actionable development plan.</p></div>
        <div className="flex flex-wrap items-center justify-end gap-2"><Badge variant={blueprintIsStale ? "outline" : "default"} className={cn("text-[10px]", blueprintIsStale ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600")}>{blueprintIsStale ? "Needs regeneration" : "Ready to use"}</Badge><Button variant={blueprintIsStale ? "default" : "outline"} size="sm" className="min-h-11 gap-1.5 text-xs" onClick={handleGenerate} disabled={isGenerating}><RefreshCw className={cn("size-3.5", isGenerating && "animate-spin")} />{isGenerating ? "Generating…" : "Regenerate"}</Button></div>
      </div>

      {!blueprintIsStale && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10"><CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-sm font-bold text-foreground">Architecture ready</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">The blueprint reflects your current technology stack and compatibility results.</p></div></div></div>}
      {blueprintIsStale && <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400"><AlertCircle className="mt-0.5 size-4 shrink-0" /><p>The selected stack or project definition changed. Regenerate the blueprint before using it as the source of truth.</p></div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card><CardHeader><CardTitle className="text-lg">{blueprint.title}</CardTitle><CardDescription>{blueprint.description}</CardDescription></CardHeader><CardContent className="flex flex-col gap-6">
            {project && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3"><h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Project Definition</h4><p className="mt-1 text-xs font-semibold text-foreground">{project.name || "Unnamed project"}</p>{project.description && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{project.description}</p>}{project.requirements && <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Goals:</span> {project.requirements}</p>}</div>}
            {blueprint.validation && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-[10px]"><span className="font-bold uppercase tracking-widest text-muted-foreground">Compatibility</span><Badge variant={blueprint.validation.valid ? "default" : "destructive"} className="text-[9px]">{blueprint.validation.status}</Badge><span className="font-semibold text-foreground">{blueprint.validation.score}%</span>{blueprint.validation.missingDependencies.length > 0 && <span className="text-amber-700 dark:text-amber-400">Missing: {blueprint.validation.missingDependencies.join(", ")}</span>}{blueprint.validation.conflicts.length > 0 && <span className="text-rose-700 dark:text-rose-400">Conflicts: {blueprint.validation.conflicts.length}</span>}</div>}
            <div className="flex flex-col gap-2.5"><h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><BookOpen className="size-3" /> Learning & Development Goals</h4><ul className="grid grid-cols-1 gap-2 md:grid-cols-2">{blueprint.learningGoals.map((goal, idx) => <li key={idx} className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 p-2 text-[11px] leading-tight text-muted-foreground"><CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" />{goal}</li>)}</ul></div>
            <div className="flex flex-col gap-2.5"><h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><Terminal className="size-3" /> Starter Commands</h4><div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300">{blueprint.starterCommands.map((cmd, idx) => <div key={idx} className={cn(cmd.startsWith("#") ? "italic text-zinc-500" : "text-emerald-400")}>{cmd}</div>)}</div></div>
            {blueprint.warnings && blueprint.warnings.length > 0 && <div className="flex flex-col gap-2.5"><h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><AlertCircle className="size-3" /> Integration Considerations</h4><div className="flex flex-wrap gap-2">{blueprint.warnings.map((warn, idx) => <Badge key={idx} variant="outline" className="border-amber-500/20 bg-amber-500/5 text-[10px] font-normal text-amber-600">{warn}</Badge>)}</div></div>}
          </CardContent></Card>
        </div>

        <div id="exports" className="flex flex-col gap-4">
          <Card className="h-fit"><CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Next steps</CardTitle><CardDescription className="text-xs">Take the validated architecture into development.</CardDescription></CardHeader><CardContent className="flex flex-col gap-2.5"><Button variant="outline" size="sm" className="min-h-11 justify-start gap-2 text-xs font-medium" onClick={() => handleCopy("markdown")}>{copiedMd ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Copy className="size-4" />}{copiedMd ? "Copied Markdown" : "Copy as Markdown"}</Button><Button variant="outline" size="sm" className="min-h-11 justify-start gap-2 text-xs font-medium" onClick={() => handleCopy("json")}>{copiedJson ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Copy className="size-4" />}{copiedJson ? "Copied JSON" : "Copy as JSON"}</Button>{copyError && <p className="text-[10px] text-amber-700 dark:text-amber-400" role="status">{copyError}</p>}<div className="my-1 h-px bg-border" /><Button className="min-h-11 justify-start gap-2 text-xs" onClick={() => downloadBlueprint("markdown")}><Download className="size-4" />Download .md Blueprint</Button><Button variant="secondary" className="min-h-11 justify-start gap-2 text-xs" onClick={() => downloadBlueprint("json")}><Download className="size-4" />Download .json Schema</Button></CardContent></Card>
          <Card className="border-primary/20 bg-primary/5"><CardContent className="flex flex-col items-center gap-2 p-4 text-center"><ArrowDown className="size-4 text-primary" /><h4 className="text-xs font-bold text-primary">From idea to implementation</h4><p className="text-[10px] leading-relaxed text-muted-foreground">Your project context, selected technologies, compatibility results, and starter commands stay together in one blueprint.</p></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
