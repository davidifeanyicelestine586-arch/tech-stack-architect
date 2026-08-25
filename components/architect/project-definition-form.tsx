"use client";

import { FormEvent, useState } from "react";
import { ClipboardList, Sparkles } from "lucide-react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProjectDefinition } from "@/lib/types";
import { validateProjectDefinition } from "@/engine/requirementAnalyzer.js";

export function ProjectDefinitionForm() {
  const {
    domains,
    projectDefinition,
    updateProjectDefinition,
    analyzeProject,
  } = useTechStack();
  const [error, setError] = useState("");

  const updateDraft = <Key extends keyof ProjectDefinition>(
    key: Key,
    value: ProjectDefinition[Key]
  ) => {
    updateProjectDefinition(key, value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = projectDefinition.name.trim();
    const description = projectDefinition.description.trim();

    const project = {
      ...projectDefinition,
      name,
      description,
      requirements: projectDefinition.requirements.trim(),
    };
    const validation = validateProjectDefinition(project);

    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return;
    }

    setError("");
    analyzeProject(project);
  };

  return (
    <Card id="define" className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">Define Your Project</CardTitle>
                <Badge variant="outline" className="gap-1 border-primary/30 text-[10px] text-primary">
                  <Sparkles className="size-3" />
                  Deterministic workflow
                </Badge>
              </div>
              <CardDescription className="mt-1 max-w-2xl text-xs leading-relaxed">
                Describe what you are building. The architect will match your definition against the registered domains, components, and recipes.
              </CardDescription>
            </div>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Step 1 of 6</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-foreground">
              Project name
              <Input
                value={projectDefinition.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="AI Document Q&A Platform"
                aria-describedby="project-definition-error"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-foreground">
              Project type / domain
              <select
                value={projectDefinition.domain}
                onChange={(event) => updateDraft("domain", event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1.5 text-xs font-semibold text-foreground">
            Project description
            <textarea
                value={projectDefinition.description}
              onChange={(event) => updateDraft("description", event.target.value)}
              placeholder="A SaaS application where users upload PDF documents and ask questions about their contents."
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="grid gap-1.5 text-xs font-semibold text-foreground">
              Goals and requirements
              <textarea
                value={projectDefinition.requirements}
                onChange={(event) => updateDraft("requirements", event.target.value)}
                placeholder="web application, document upload, PDF processing, data storage, deployment"
                className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-foreground md:min-w-44">
              Difficulty preference
              <select
                value={projectDefinition.difficulty}
                onChange={(event) => updateDraft("difficulty", event.target.value as ProjectDefinition["difficulty"])}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
            <p id="project-definition-error" className="text-[11px] text-rose-600 dark:text-rose-400" aria-live="polite">
              {error}
            </p>
            <Button type="submit" className="gap-2 text-xs">
              <Sparkles className="size-3.5" />
              Analyze Project
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
