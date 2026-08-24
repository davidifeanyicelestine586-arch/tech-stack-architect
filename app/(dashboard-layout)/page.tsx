import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  FileCode2,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ComponentBrowser } from "@/components/architect/component-browser";
import { DomainSelector } from "@/components/architect/domain-selector";
import { SelectedStack } from "@/components/architect/selected-stack";
import { ValidationPanel } from "@/components/architect/validation-panel";
import { RecipeRecommendations } from "@/components/architect/recipe-recommendations";
import { BlueprintPanel } from "@/components/architect/blueprint-panel";
import { ProjectDefinitionForm } from "@/components/architect/project-definition-form";
import { RecommendationPanel } from "@/components/architect/recommendation-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import componentsData from "@/data/components.json";
import domainsData from "@/data/domain.json";
import recipesData from "@/data/recipes.json";

export const metadata: Metadata = {
  title: "Workspace | Ediccrew Tech Stack Architect",
  description:
    "Design, validate, understand, and generate production-ready technology stacks.",
};

export default function WorkspacePage() {
  const domains = domainsData;
  const components = componentsData;
  const recipes = recipesData;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 shadow-xs md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 border-primary/30 bg-background/80 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3 text-primary" />
                Interactive workspace
              </Badge>
              <Badge variant="secondary" className="text-xs">v2.0 Architecture</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Ediccrew Tech Stack Architect
            </h1>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Define what you are building, analyze registered technologies, review explainable recommendations, and assemble a validated architecture.
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Define <span className="text-muted-foreground">→</span> Analyze <span className="text-muted-foreground">→</span> Recommend <span className="text-muted-foreground">→</span> Validate <span className="text-muted-foreground">→</span> Blueprint
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button className="gap-2 shadow-xs" render={<Link href="#define" />}>
              <Sparkles className="size-4" />
              Define Project
            </Button>
            <Button variant="outline" className="gap-2" render={<Link href="#components" />}>
              <Layers className="size-4" />
              Manual Catalog
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-6 sm:grid-cols-4">
          <Metric label="Engineering Domains" value={domains.length} />
          <Metric label="Registered Nodes" value={`${components.length}+`} />
          <Metric label="Curated Recipes" value={recipes.length} />
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Validation Engine</span>
            <span className="flex items-center gap-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" /> Ready
            </span>
          </div>
        </div>
      </section>

      {/* 2. Define and Analyze */}
      <ProjectDefinitionForm />
      <RecommendationPanel />

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Domain Selector & Browser */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="flex flex-col gap-5" id="components">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Component Workspace</h2>
              <p className="text-xs text-muted-foreground">
                Choose a domain, narrow the catalog, and add the technology nodes you want to evaluate.
              </p>
            </div>
            <DomainSelector />
            <ComponentBrowser />
          </section>

          <RecipeRecommendations />
          <BlueprintPanel />
        </div>

        {/* Right Column: Stack & Validation */}
        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
          <SelectedStack />
          <ValidationPanel />
          
          <Card id="docs" className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-primary flex items-center gap-1.5">
                <BookOpen className="size-3.5" /> Documentation Registry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Every component in our registry includes a full hardware specification and integration guide.
              </p>
              <Button variant="link" className="h-auto p-0 text-[10px] font-bold text-primary underline mt-2" render={<Link href="/content-detail" />}>
                Browse Detailed Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Feature Highlights */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<ShieldCheck className="size-4" />}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          title="Deterministic Validation"
          description="Resolves dependencies, flags hardware pin contention, and detects architectural anti-patterns with score math."
        />
        <FeatureCard
          icon={<Sparkles className="size-4" />}
          iconClassName="bg-primary/10 text-primary"
          title="Recipe Recommender"
          description="Matches chosen technologies against validated recipes and computes their affinity."
        />
        <FeatureCard
          icon={<FileCode2 className="size-4" />}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          title="Blueprint Synthesis & Export"
          description="Generates engineering blueprints, starter scripts, and exportable Markdown or JSON schemas."
        />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}

function FeatureCard({
  icon,
  iconClassName,
  title,
  description,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className={`mb-2 flex size-8 items-center justify-center rounded-lg ${iconClassName}`}>{icon}</div>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
