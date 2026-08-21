import React from "react";
import type { Metadata } from "next";
import {
  Layers,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Globe,
  Bot,
  Cpu,
  ArrowRight,
  Download,
  Terminal,
  Code2,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import domainsData from "@/data/domain.json";
import componentsData from "@/data/components.json";
import recipesData from "@/data/recipes.json";
import Link from "next/link";

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
      {/* ========================================================================= */}
      {/* 1. Header Banner */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background/80 border-primary/30 text-primary gap-1 px-2.5 py-0.5 text-xs font-semibold">
                <Sparkles className="w-3 h-3 text-primary" />
                Next.js + shadcn UI Foundation
              </Badge>
              <Badge variant="secondary" className="text-xs">
                v2.0 Architecture
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Ediccrew Tech Stack Architect
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              An intelligent, domain-driven engineering platform to design, validate, resolve conflicts, and synthesize production-ready architecture blueprints.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button className="gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="#components">
                <Layers className="w-4 h-4" />
                <span>Explore Components</span>
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="#recipes">
                <BookOpen className="w-4 h-4" />
                <span>View Recipes</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Engineering Domains
            </span>
            <span className="text-xl font-bold text-foreground">
              {domains.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Registered Nodes
            </span>
            <span className="text-xl font-bold text-foreground">
              {components.length}+
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Curated Recipes
            </span>
            <span className="text-xl font-bold text-foreground">
              {recipes.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Validation Engine
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Ready
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Engineering Domains */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-4" id="domains">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Engineering Tracks & Domains
            </h2>
            <p className="text-xs text-muted-foreground">
              Select an engineering track to browse specialized components and blueprints.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {domains.map((dom) => {
            const domainComponents = components.filter((c) => c.domain === dom.id);
            const domainRecipes = recipes.filter((r) => r.domain === dom.id);

            return (
              <Card
                key={dom.id}
                className="group relative flex flex-col justify-between overflow-hidden transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
              >
                <div
                  className="absolute top-0 left-0 h-1 w-full"
                  style={{ backgroundColor: dom.color || "var(--primary)" }}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{dom.icon}</span>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {domainComponents.length} Nodes
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                    {dom.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {dom.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1">
                    {dom.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span>{domainRecipes.length} Curated Recipes</span>
                    <span className="text-primary font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Browse Track <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Core Engine Architecture Pillars */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Deterministic Validation
            </CardTitle>
            <CardDescription className="text-xs">
              Resolves dependencies, flags hardware pin contention, and detects architectural anti-patterns with score math (0-100).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Automatic missing dependency resolution</li>
              <li>GPIO / PWM hardware pin collision detection</li>
              <li>SaaS concurrency & security rule checking</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Recipe Recommender
            </CardTitle>
            <CardDescription className="text-xs">
              Matches chosen technologies against battle-tested recipes, computing percentage affinity and guided outputs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Real-time affinity score computation</li>
              <li>Estimated development & learning hours</li>
              <li>Prescribed project deliverables & milestones</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2">
              <FileCode2 className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Blueprint Synthesis & Export
            </CardTitle>
            <CardDescription className="text-xs">
              Generates complete engineering blueprints, runnable starter scripts, and exportable Markdown / JSON schemas.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Interactive CLI starter commands</li>
              <li>Formatted Markdown documentation download</li>
              <li>Structured JSON architecture schema export</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 4. Curated Recipe Highlights */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-4" id="recipes">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Curated Architecture Recipes
            </h2>
            <p className="text-xs text-muted-foreground">
              Pre-configured, validated recipes ready for 1-click blueprint generation.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {recipes.length} Verified
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="flex flex-col justify-between hover:border-border/80 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {recipe.domain === "web-saas"
                      ? "Web & SaaS"
                      : recipe.domain === "ai-automation"
                      ? "AI Automation"
                      : "Mechatronics"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    ~{recipe.estimatedHours}h est.
                  </span>
                </div>
                <CardTitle className="text-sm font-bold">
                  {recipe.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {recipe.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Core Components
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {recipe.components.map((cId) => {
                      const comp = components.find((c) => c.id === cId);
                      return (
                        <Badge
                          key={cId}
                          variant="outline"
                          className="text-[10px] bg-muted/30 font-normal"
                        >
                          {comp ? comp.name : cId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground">
                    Difficulty: <strong className="text-foreground">{recipe.difficulty}</strong>
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1 hover:bg-primary/10">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
