import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, FileCode2, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { ComponentBrowser } from "@/components/architect/component-browser";
import { DomainSelector } from "@/components/architect/domain-selector";
import { SelectedStack } from "@/components/architect/selected-stack";
import { ValidationPanel } from "@/components/architect/validation-panel";
import { RecipeRecommendations } from "@/components/architect/recipe-recommendations";
import { BlueprintPanel } from "@/components/architect/blueprint-panel";
import { ProjectDefinitionForm } from "@/components/architect/project-definition-form";
import { RecommendationPanel } from "@/components/architect/recommendation-panel";
import { WorkflowProgress } from "@/components/architect/workflow-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import componentsData from "@/data/components.json";
import domainsData from "@/data/domain.json";
import recipesData from "@/data/recipes.json";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Workspace | Ediccrew Tech Stack Architect",
  description: "Design, validate, understand, and generate production-ready technology stacks.",
};

export default function WorkspacePage() {
  const domains = domainsData;
  const components = componentsData;
  const recipes = recipesData;

  return (
    <div className="flex flex-col gap-6 pb-12 sm:gap-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 shadow-xs sm:p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center md:gap-6">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 border-primary/30 bg-background/80 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3" aria-hidden="true" />
                Guided architecture workspace
              </Badge>
              <Badge variant="secondary" className="px-2.5 py-1 text-xs">v2.0 Architecture</Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">Ediccrew Tech Stack Architect</h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Describe what you are building and let Architect guide you from project definition to a validated technology stack and architecture blueprint.
            </p>
          </div>
          <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap md:w-auto md:gap-3">
            <Button className="h-11 w-full gap-2 px-4 shadow-xs sm:w-auto sm:px-5" render={<Link href="#define" />}>
              <Sparkles className="size-4" aria-hidden="true" /> Analyze My Project
            </Button>
            <Button variant="outline" className="h-11 w-full gap-2 sm:w-auto" render={<Link href="#components" />}>
              <Layers className="size-4" aria-hidden="true" /> Browse Technology Catalog
            </Button>
          </div>
        </div>

        <div className="mt-5 border-t border-border/60 pt-5 sm:mt-6 sm:pt-5">
          <WorkflowProgress />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Start with your project. Architect handles the technical complexity as you move through each step.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border/60 pt-5 sm:mt-6 sm:grid-cols-4 sm:pt-6">
          <Metric label="Project Types" value={domains.length} />
          <Metric label="Technologies" value={`${components.length}+`} />
          <Metric label="Stack Templates" value={recipes.length} />
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Compatibility Check</span>
            <span className="text-sm font-bold text-muted-foreground sm:text-base">Not checked yet</span>
          </div>
        </div>
      </section>

      <div id="define" className="scroll-mt-24">
        <ProjectDefinitionForm />
      </div>
      <div id="recommendations" className="scroll-mt-24"><RecommendationPanel /></div>

      <div className="lg:hidden">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Step 4 · Build</p>
            <h2 className="text-base font-bold tracking-tight text-foreground">Keep your stack in view</h2>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">Mobile workspace</Badge>
        </div>
        <SelectedStack variant="mobile" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 sm:gap-8 lg:col-span-8">
          <section className="flex min-w-0 flex-col gap-5" id="components">
            <div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs font-bold">Step 4</Badge><h2 className="text-lg font-bold tracking-tight text-foreground">Build Your Stack</h2></div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Review recommended technologies first, then browse the catalog when you want to make manual adjustments.</p>
            </div>
            <DomainSelector />
            <ComponentBrowser />
          </section>
          <RecipeRecommendations />
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:col-span-4">
          <div className="hidden lg:block">
            <SelectedStack />
          </div>
          <div id="validation" className="scroll-mt-24"><ValidationPanel /></div>
        </div>
      </div>

      <div id="blueprint" className="scroll-mt-24"><BlueprintPanel /></div>

      <Card id="docs" className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-primary"><BookOpen className="size-4" aria-hidden="true" /> Need deeper technical detail?</CardTitle>
          <CardDescription className="text-xs leading-relaxed">Explore full specifications and integration guides after you have your architecture blueprint.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="link" className="h-11 p-0 text-sm font-bold text-primary underline" render={<Link href="/content-detail" />}>Browse detailed documentation</Button>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard icon={<ShieldCheck className="size-4" aria-hidden="true" />} iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Deterministic Validation" description="Checks dependencies, hardware conflicts, and architectural rules before you treat a stack as ready." />
        <FeatureCard icon={<Sparkles className="size-4" aria-hidden="true" />} iconClassName="bg-primary/10 text-primary" title="Explainable Recommendations" description="Recommendations are matched against your project requirements so you can understand why a technology fits." />
        <FeatureCard icon={<FileCode2 className="size-4" aria-hidden="true" />} iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400" title="Architecture Blueprint" description="Turn a validated stack into an engineering blueprint, starter commands, and exportable documentation." />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="flex min-w-0 flex-col"><span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span><span className="text-lg font-bold text-foreground sm:text-xl">{value}</span></div>;
}

function FeatureCard({ icon, iconClassName, title, description }: { icon: ReactNode; iconClassName: string; title: string; description: string }) {
  return <Card className="bg-card"><CardHeader className="pb-2"><div className={`mb-2 flex size-8 items-center justify-center rounded-lg ${iconClassName}`}>{icon}</div><CardTitle className="text-sm font-semibold">{title}</CardTitle><CardDescription className="text-xs leading-relaxed">{description}</CardDescription></CardHeader></Card>;
}
