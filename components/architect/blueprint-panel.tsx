"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode2, Download, Copy, Terminal, CheckCircle2, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function BlueprintPanel() {
  const {
    blueprint,
    projectDefinition,
    generateCustomBlueprint,
    selectedComponents,
    copyBlueprint,
    downloadBlueprint,
  } = useTechStack();

  const [copiedJson, setCopiedJson] = React.useState(false);
  const [copiedMd, setCopiedMd] = React.useState(false);

  const selectedComponentSignature = React.useMemo(
    () => JSON.stringify(selectedComponents.map((component) => component.id).sort()),
    [selectedComponents]
  );

  const blueprintComponentSignature = React.useMemo(
    () => JSON.stringify((blueprint?.components ?? []).map((component) => component.id).sort()),
    [blueprint]
  );

  const currentProjectSignature = JSON.stringify({
    name: projectDefinition.name.trim(),
    description: projectDefinition.description.trim(),
    domain: projectDefinition.domain,
    difficulty: projectDefinition.difficulty,
    requirements: projectDefinition.requirements.trim(),
  });

  const blueprintProject = blueprint?.project;
  const blueprintProjectSignature = JSON.stringify({
    name: blueprintProject?.name?.trim() ?? "",
    description: blueprintProject?.description?.trim() ?? "",
    domain: blueprintProject?.domain ?? blueprint?.domain ?? "",
    difficulty: blueprintProject?.difficulty ?? "",
    requirements: blueprintProject?.requirements?.trim() ?? "",
  });

  const blueprintIsStale = Boolean(
    blueprint &&
      (selectedComponentSignature !== blueprintComponentSignature ||
        currentProjectSignature !== blueprintProjectSignature)
  );

  if (selectedComponents.length === 0) {
    return (
      <div id="blueprint" className="flex flex-col gap-4">
        <Card id="exports" className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <FileCode2 className="mb-3 size-6 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Blueprint & Export Center</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Select technology nodes to generate a blueprint and enable Markdown or JSON exports.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCopy = async (format: "json" | "markdown") => {
    const success = await copyBlueprint(format);
    if (success) {
      if (format === "json") {
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
      } else {
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 2000);
      }
    }
  };

  const project = blueprint?.project || (projectDefinition.name || projectDefinition.description ? projectDefinition : null);

  if (!blueprint) {
    return (
      <div id="blueprint" className="flex flex-col gap-4">
        <Card id="exports" className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 rounded-full bg-muted/60 p-3">
              <FileCode2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Synthesize Your Blueprint</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Once you&apos;ve selected your technology nodes, generate a full architecture blueprint with starter scripts.
            </p>
            <Button className="mt-6 gap-2 text-xs" onClick={generateCustomBlueprint}>
              <Terminal className="h-3.5 w-3.5" />
              Generate Custom Blueprint
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="blueprint" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <FileCode2 className="h-4 w-4 text-primary" />
          Architecture Blueprint
        </h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge
            variant={blueprintIsStale ? "outline" : "default"}
            className={cn(
              "text-[10px]",
              blueprintIsStale
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
            )}
          >
            {blueprintIsStale ? "Needs regeneration" : "Up to date"}
          </Badge>
          <Button
            variant={blueprintIsStale ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={generateCustomBlueprint}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate Blueprint
          </Button>
        </div>
      </div>

      {blueprintIsStale && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The selected stack or project definition changed after this blueprint was generated. Regenerate it to keep the blueprint synchronized with the current workspace.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{blueprint.title}</CardTitle>
              <CardDescription>{blueprint.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {project && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Project Definition</h4>
                  <p className="mt-1 text-xs font-semibold text-foreground">{project.name || "Unnamed project"}</p>
                  {project.description && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{project.description}</p>}
                  {project.requirements && (
                    <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Goals:</span> {project.requirements}
                    </p>
                  )}
                </div>
              )}

              {blueprint.validation && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-[10px]">
                  <span className="font-bold uppercase tracking-widest text-muted-foreground">Validation</span>
                  <Badge variant={blueprint.validation.valid ? "default" : "destructive"} className="text-[9px]">
                    {blueprint.validation.status}
                  </Badge>
                  <span className="font-semibold text-foreground">{blueprint.validation.score}%</span>
                  {blueprint.validation.missingDependencies.length > 0 && (
                    <span className="text-amber-700 dark:text-amber-400">
                      Missing: {blueprint.validation.missingDependencies.join(", ")}
                    </span>
                  )}
                  {blueprint.validation.conflicts.length > 0 && (
                    <span className="text-rose-700 dark:text-rose-400">
                      Conflicts: {blueprint.validation.conflicts.length}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <BookOpen className="h-3 w-3" /> Learning & Development Goals
                </h4>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {blueprint.learningGoals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 p-2 text-[11px] leading-tight text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2.5">
                <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <Terminal className="h-3 w-3" /> Starter Commands
                </h4>
                <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300">
                  {blueprint.starterCommands.map((cmd, idx) => (
                    <div key={idx} className={cn(cmd.startsWith("#") ? "italic text-zinc-500" : "text-emerald-400")}>
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>

              {blueprint.warnings && blueprint.warnings.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <AlertCircle className="h-3 w-3" /> Integration Considerations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {blueprint.warnings.map((warn, idx) => (
                      <Badge key={idx} variant="outline" className="border-amber-500/20 bg-amber-500/5 text-[10px] font-normal text-amber-600">
                        {warn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div id="exports" className="flex flex-col gap-4">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Actions & Export</CardTitle>
              <CardDescription className="text-xs">Export your architecture for development.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="h-9 justify-start gap-2 text-xs font-medium" onClick={() => handleCopy("markdown")}>
                  {copiedMd ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copiedMd ? "Copied Markdown" : "Copy as Markdown"}
                </Button>
                <Button variant="outline" size="sm" className="h-9 justify-start gap-2 text-xs font-medium" onClick={() => handleCopy("json")}>
                  {copiedJson ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copiedJson ? "Copied JSON" : "Copy as JSON"}
                </Button>
              </div>

              <div className="my-1 h-px bg-border" />

              <div className="grid grid-cols-1 gap-2">
                <Button className="h-9 justify-start gap-2 text-xs" onClick={() => downloadBlueprint("markdown")}>
                  <Download className="h-4 w-4" />
                  Download .md Blueprint
                </Button>
                <Button variant="secondary" className="h-9 justify-start gap-2 text-xs" onClick={() => downloadBlueprint("json")}>
                  <Download className="h-4 w-4" />
                  Download .json Schema
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-2 p-4 text-center">
              <h4 className="text-xs font-bold text-primary">Need dynamic scaling?</h4>
              <p className="text-[10px] leading-tight text-muted-foreground">
                Our Cloud Integration plugin can auto-generate Terraform scripts for this specific stack.
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold text-primary underline">
                View Enterprise Plugins
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
