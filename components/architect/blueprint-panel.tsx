"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode2, Download, Copy, Terminal, CheckCircle2, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BlueprintPanel() {
  const { 
    blueprint, 
    generateCustomBlueprint, 
    selectedComponents, 
    copyBlueprint, 
    downloadBlueprint 
  } = useTechStack();

  const [copiedJson, setCopiedJson] = React.useState(false);
  const [copiedMd, setCopiedMd] = React.useState(false);

  if (selectedComponents.length === 0) return null;

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

  if (!blueprint) {
    return (
      <Card id="blueprint" className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="p-3 rounded-full bg-muted/60 mb-3">
            <FileCode2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Synthesize Your Blueprint</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Once you've selected your technology nodes, generate a full architecture blueprint with starter scripts.
          </p>
          <Button 
            className="mt-6 text-xs gap-2" 
            onClick={generateCustomBlueprint}
          >
            <Terminal className="w-3.5 h-3.5" />
            Generate Custom Blueprint
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="blueprint" className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-primary" />
          Architecture Blueprint
        </h3>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
          Synthesized Successfully
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{blueprint.title}</CardTitle>
              <CardDescription>{blueprint.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Learning Goals */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> Learning & Development Goals
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {blueprint.learningGoals.map((goal, idx) => (
                    <li key={idx} className="text-[11px] flex items-start gap-2 text-muted-foreground leading-tight p-2 rounded-md bg-muted/30 border border-border/50">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Starter Commands */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" /> Starter Commands
                </h4>
                <div className="bg-zinc-950 rounded-lg p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto border border-zinc-800">
                  {blueprint.starterCommands.map((cmd, idx) => (
                    <div key={idx} className={cn(cmd.startsWith("#") ? "text-zinc-500 italic" : "text-emerald-400")}>
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {blueprint.warnings && blueprint.warnings.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Integration Considerations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {blueprint.warnings.map((warn, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] border-amber-500/20 bg-amber-500/5 text-amber-600 font-normal">
                        {warn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions / Export */}
        <div id="exports" className="flex flex-col gap-4">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Actions & Export</CardTitle>
              <CardDescription className="text-xs">Export your architecture for development.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start text-xs gap-2 font-medium"
                  onClick={() => handleCopy("markdown")}
                >
                  {copiedMd ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedMd ? "Copied Markdown" : "Copy as Markdown"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start text-xs gap-2 font-medium"
                  onClick={() => handleCopy("json")}
                >
                  {copiedJson ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedJson ? "Copied JSON" : "Copy as JSON"}
                </Button>
              </div>

              <div className="h-px bg-border my-1" />

              <div className="grid grid-cols-1 gap-2">
                <Button 
                  className="h-9 justify-start text-xs gap-2"
                  onClick={() => downloadBlueprint("markdown")}
                >
                  <Download className="w-4 h-4" />
                  Download .md Blueprint
                </Button>
                <Button 
                  variant="secondary" 
                  className="h-9 justify-start text-xs gap-2"
                  onClick={() => downloadBlueprint("json")}
                >
                  <Download className="w-4 h-4" />
                  Download .json Schema
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex flex-col gap-2 text-center">
              <h4 className="text-xs font-bold text-primary">Need dynamic scaling?</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">
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
