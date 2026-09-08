import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, FileCode2, Layers, ShieldCheck, Sparkles } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col gap-8 pb-12">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 shadow-xs md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 border-primary/30 bg-background/80 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3 text-primary" />
                Guided architecture workspace
              </Badge>
              <Badge variant="secondary" className="text-xs">v2.0 Architecture</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Ediccrew Tech Stack Architect</h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Describe what you are building and let Architect guide you from project definition to a validated technology stack and architecture blueprint.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button className="h-11 gap-2 px-5 shadow-xs" render={<Link href="#define" />}>
              <Sparkles className="size-4" /> Analyze My Project
            </Button>
            <Button variant="outline" className="h-11 gap-2" render={<Link href="#components" />}>
              <Layers className="size-4" /> Browse Technology Catalog
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t border-border/60 pt-5">
          <WorkflowProgress />
          <p className="mt-3 text-xs text-muted-foreground">Start with your project. Architect handles the technical complexity as you move through each step.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-6 sm:grid-cols-4">
          <Metric label="Project Types" value={domains.length} />
          <Metric label="Technologies" value={`${components.length}+`} />
          <Metric label="Stack Templates" value={recipes.length} />
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Compatibility Check</span>
            <span className="flex items-center gap-1 text-xl font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" /> Ready</span>
          </div>
        </div>
      </section>

      <ProjectDefinitionForm />
      <div id="recommendations" className="scroll-mt-24"><RecommendationPanel /></div>

      <div className="lg:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Step 4 · Build</p>
            <h2 className="text-base font-bold tracking-tight text-foreground">Keep your stack in view</h2>
          </div>
          <Badge variant="outline" className="text-[10px]">Mobile workspace</Badge>
        </div>
        <SelectedStack variant="mobile" />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <section className="flex flex-col gap-5" id="components">
            <div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px] font-bold">Step 4</Badge><h2 className="text-lg font-bold tracking-tight text-foreground">Build Your Stack</h2></div>
              <p className="mt-1 text-xs text-muted-foreground">Review recommended technologies first, then browse the catalog when you want to make manual adjustments.</p>
            </div>
            <DomainSelector />
            <ComponentBrowser />
          </section>
          <RecipeRecommendations />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-4">
          <div className="hidden lg:block">
            <SelectedStack />
          </div>
          <div id="validation" className="scroll-mt-24"><ValidationPanel /></div>
        </div>
      </div>

      <div id="blueprint" className="scroll-mt-24"><BlueprintPanel /></div>

      <Card id="docs" className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs font-bold text-primary"><BookOpen className="size-3.5" /> Need deeper technical detail?</CardTitle>
          <CardDescription className="text-[10px]">Explore full specifications and integration guides after you have your architecture blueprint.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="link" className="h-10 p-0 text-xs font-bold text-primary underline" render={<Link href="/content-detail" />}>Browse detailed documentation</Button>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard icon={<ShieldCheck className="size-4" />} iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Deterministic Validation" description="Checks dependencies, hardware conflicts, and architectural rules before you treat a stack as ready." />
        <FeatureCard icon={<Sparkles className="size-4" />} iconClassName="bg-primary/10 text-primary" title="Explainable Recommendations" description="Recommendations are matched against your project requirements so you can understand why a technology fits." />
        <FeatureCard icon={<FileCode2 className="size-4" />} iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400" title="Architecture Blueprint" description="Turn a validated stack into an engineering blueprint, starter commands, and exportable documentation." />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="flex flex-col"><span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span><span className="text-xl font-bold text-foreground">{value}</span></div>;
}

function FeatureCard({ icon, iconClassName, title, description }: { icon: ReactNode; iconClassName: string; title: string; description: string }) {
  return <Card className="bg-card"><CardHeader className="pb-2"><div className={`mb-2 flex size-8 items-center justify-center rounded-lg ${iconClassName}`}>{icon}</div><CardTitle className="text-sm font-semibold">{title}</CardTitle><CardDescription className="text-xs">{description}</CardDescription></CardHeader></Card>;
}
