"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Clock, Trophy, ChevronDown } from "lucide-react";
import { useTechStack } from "@/hooks/use-tech-stack";

export function RecipeRecommendations() {
  const { recipeRecommendations, loadRecipe, selectedComponents } = useTechStack();

  if (selectedComponents.length === 0) {
    return (
      <div id="recipes" className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="size-4 text-primary" />
            Stack Templates
          </h3>
          <Badge variant="outline" className="text-[10px] font-mono">
            Select a stack first
          </Badge>
        </div>
        <Card className="border-dashed bg-muted/20">
          <CardContent className="p-6 text-center">
            <p className="text-xs text-muted-foreground">
              Add technologies to your stack to see templates that match your architecture.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="recipes" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="size-4 text-primary" />
            Recommended Stack Templates
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Start with a proven combination, then adjust it to your project.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-[10px] font-mono">
          {recipeRecommendations.length} matches
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {recipeRecommendations.slice(0, 4).map(({ recipe, score }) => (
          <Card key={recipe.id} className="group overflow-hidden transition-colors hover:border-primary/50">
            <CardHeader className="gap-2 pb-3">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
                  {recipe.domain.replace("-", " ")}
                </Badge>
                <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Trophy className="size-3" />
                  {score}% match
                </div>
              </div>
              <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">
                {recipe.title}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed line-clamp-2">
                {recipe.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> ~{recipe.estimatedHours}h
                </span>
                <span className="size-1 rounded-full bg-border" />
                <span>{recipe.difficulty}</span>
              </div>

              <details className="group/details rounded-lg border border-border/60 bg-muted/20">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-[11px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span>What this template gives you</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/details:rotate-180" />
                </summary>
                <div className="border-t border-border/60 px-3 pb-3 pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
                  A compatible starting stack for this project type, with the technologies selected as a working baseline.
                </div>
              </details>

              <Button
                onClick={() => loadRecipe(recipe.id)}
                className="min-h-11 w-full gap-1.5 text-xs"
              >
                Use This Template <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
