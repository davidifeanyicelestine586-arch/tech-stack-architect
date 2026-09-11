"use client";

import { FormEvent, useState, useTransition } from "react";
import { ClipboardList, Loader2, Sparkles } from "lucide-react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProjectDefinition } from "@/lib/types";
import { validateProjectDefinition } from "@/engine/requirementAnalyzer.js";

export function ProjectDefinitionForm() {
  const { domains, projectDefinition, updateProjectDefinition, analyzeProject } = useTechStack();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const updateDraft = <Key extends keyof ProjectDefinition>(key: Key, value: ProjectDefinition[Key]) => {
    updateProjectDefinition(key, value);
    if (error) setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const project = {
      ...projectDefinition,
      name: projectDefinition.name.trim(),
      description: projectDefinition.description.trim(),
      requirements: projectDefinition.requirements.trim(),
    };
    const validation = validateProjectDefinition(project);

    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return;
    }

    setError("");
    startTransition(() => {
      analyzeProject(project);
    });
  };

  return (
    <Card id="define" className="scroll-mt-24 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">What are you building?</CardTitle>
                <Badge variant="outline" className="gap-1 border-primary/30 text-[10px] text-primary">
                  <Sparkles className="size-3" aria-hidden="true" /> Guided analysis
                </Badge>
              </div>
              <CardDescription className="mt-1 max-w-2xl text-xs leading-relaxed">
                Give Architect the context it needs. We’ll handle the technical matching and compatibility checks for you.
              </CardDescription>
            </div>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Step 1 of 6</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form className="grid gap-6" onSubmit={handleSubmit} aria-busy={isPending}>
          <fieldset className="grid gap-4">
            <legend className="text-sm font-bold text-foreground">Project basics</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label htmlFor="project-name" className="grid gap-1.5 text-xs font-semibold text-foreground">
                Project name
                <Input
                  id="project-name"
                  className="h-11 text-sm"
                  value={projectDefinition.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  placeholder="AI Document Q&A Platform"
                  aria-describedby="project-definition-error"
                  aria-invalid={Boolean(error)}
                  disabled={isPending}
                />
              </label>
              <label htmlFor="project-domain" className="grid gap-1.5 text-xs font-semibold text-foreground">
                Project type
                <select
                  id="project-domain"
                  value={projectDefinition.domain}
                  onChange={(event) => updateDraft("domain", event.target.value)}
                  disabled={isPending}
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.title}</option>)}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="text-sm font-bold text-foreground">What should it do?</legend>
            <label htmlFor="project-description" className="grid gap-1.5 text-xs font-semibold text-foreground">
              Describe the project
              <textarea
                id="project-description"
                value={projectDefinition.description}
                onChange={(event) => updateDraft("description", event.target.value)}
                placeholder="A SaaS application where users upload PDF documents and ask questions about their contents."
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
              />
            </label>
            <label htmlFor="project-requirements" className="grid gap-1.5 text-xs font-semibold text-foreground">
              Goals and requirements
              <textarea
                id="project-requirements"
                value={projectDefinition.requirements}
                onChange={(event) => updateDraft("requirements", event.target.value)}
                placeholder="web application, document upload, PDF processing, data storage, deployment"
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="text-sm font-bold text-foreground">How should Architect optimize?</legend>
            <label htmlFor="project-difficulty" className="grid max-w-sm gap-1.5 text-xs font-semibold text-foreground">
              Complexity preference
              <select
                id="project-difficulty"
                value={projectDefinition.difficulty}
                onChange={(event) => updateDraft("difficulty", event.target.value as ProjectDefinition["difficulty"])}
                disabled={isPending}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="Beginner">Beginner — prioritize simplicity</option>
                <option value="Intermediate">Intermediate — balance simplicity and capability</option>
                <option value="Advanced">Advanced — prioritize capability and control</option>
              </select>
            </label>
          </fieldset>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p
              id="project-definition-error"
              className="min-h-5 text-xs text-rose-600 dark:text-rose-400"
              role={error ? "alert" : undefined}
              aria-live="polite"
            >
              {error}
            </p>
            <div className="sm:text-right">
              <p className="mb-2 text-[11px] text-muted-foreground">Recommended — we’ll use this information to select compatible technologies.</p>
              <Button type="submit" className="h-11 w-full gap-2 px-5 text-sm font-semibold sm:w-auto" disabled={isPending} aria-disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                {isPending ? "Analyzing…" : "Analyze My Project"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
