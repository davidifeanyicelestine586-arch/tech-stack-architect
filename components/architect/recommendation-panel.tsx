"use client";

import { useState } from "react";
import { Check, Eye, Plus, Sparkles, X } from "lucide-react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentDetailModal } from "@/components/architect/component-detail-modal";
import type { Component } from "@/lib/types";

export function RecommendationPanel() {
  const {
    requirementAnalysis,
    ignoredRecommendationIds,
    selectedComponentIds,
    addRecommendation,
    addAllCompatibleRecommendations,
    ignoreRecommendation,
  } = useTechStack();
  const [detailComponent, setDetailComponent] = useState<Component | null>(null);

  if (!requirementAnalysis) {
    return (
      <Card id="recommendations" className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
            <Sparkles className="size-5" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Recommended Stack</h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Complete the project definition and click Analyze Project to receive explainable recommendations from the registered catalog.
          </p>
        </CardContent>
      </Card>
    );
  }

  const recommendations = requirementAnalysis.recommendations.filter(
    (recommendation) => !ignoredRecommendationIds.includes(recommendation.component.id)
  );
  const visibleRecommendations = recommendations.slice(0, 8);
  const compatibleCount = recommendations.filter((recommendation) => recommendation.compatible).length;
  const relatedRecipes = requirementAnalysis.recipeMatches.filter(({ score }) => score > 0).slice(0, 3);

  return (
    <section id="recommendations" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Recommended Stack</h2>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Sparkles className="size-3" />
              Deterministic
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Ranked from the current registry using domain, metadata, difficulty, recipe, and dependency signals for <span className="font-semibold text-foreground">{requirementAnalysis.project.name}</span>.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={addAllCompatibleRecommendations}
          disabled={compatibleCount === 0}
        >
          <Plus className="size-3.5" />
          Add All Compatible ({compatibleCount})
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
        {requirementAnalysis.matchedTerms.length > 0 && (
          <>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Matched terms</span>
            {requirementAnalysis.matchedTerms.slice(0, 12).map((term) => (
              <Badge key={term} variant="outline" className="text-[10px]">{term}</Badge>
            ))}
          </>
        )}
        {relatedRecipes.length > 0 && (
          <>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Related recipes</span>
            {relatedRecipes.map(({ recipe, score }) => (
              <Badge key={recipe.id} variant="secondary" className="text-[10px]">{recipe.title} · {score}%</Badge>
            ))}
          </>
        )}
      </div>

      {visibleRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibleRecommendations.map((recommendation) => {
            const { component } = recommendation;
            const isSelected = selectedComponentIds.includes(component.id);

            return (
              <Card key={component.id} className="overflow-hidden transition-colors hover:border-primary/40">
                <CardHeader className="gap-2 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px]">{component.category}</Badge>
                        <Badge variant="secondary" className="text-[9px]">{component.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-sm">{component.name}</CardTitle>
                    </div>
                    <div className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {recommendation.score}%
                    </div>
                  </div>
                  <CardDescription className="text-[11px] leading-relaxed">
                    {recommendation.reasons[0]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  <div className="grid gap-1.5 text-[10px] text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Why it matched:</span>{" "}
                      {recommendation.reasons.slice(1, 3).join(" ") || "Registered for evaluation."}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Matching terms:</span>{" "}
                      {recommendation.matchedTerms.length > 0 ? recommendation.matchedTerms.join(", ") : "No direct keyword match; domain or preference signal applied."}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Dependencies:</span>{" "}
                      {recommendation.dependencies.length > 0 ? recommendation.dependencies.join(", ") : "None"}
                    </div>
                  </div>

                  {recommendation.declaredConflicts.length > 0 && (
                    <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-2 text-[10px] text-rose-700 dark:text-rose-400">
                      Declared conflict with: {recommendation.declaredConflicts.join(", ")}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                    <Button
                      variant={isSelected ? "secondary" : "default"}
                      size="sm"
                      className="h-7 gap-1.5 text-[10px]"
                      onClick={() => addRecommendation(component.id)}
                      disabled={isSelected}
                    >
                      {isSelected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                      {isSelected ? "Added to Stack" : "Add Recommendation"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-[10px]"
                      onClick={() => setDetailComponent(component)}
                    >
                      <Eye className="size-3.5" />
                      View Details
                    </Button>
                    {!isSelected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-[10px] text-muted-foreground"
                        onClick={() => ignoreRecommendation(component.id)}
                      >
                        <X className="size-3.5" />
                        Ignore
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="p-6 text-center text-xs text-muted-foreground">
            No registered components matched this project definition. Try another domain or add more concrete requirements.
          </CardContent>
        </Card>
      )}

      {recommendations.length > visibleRecommendations.length && (
        <p className="px-1 text-[10px] text-muted-foreground">
          Showing the top {visibleRecommendations.length} of {recommendations.length} registry recommendations.
        </p>
      )}

      <ComponentDetailModal
        component={detailComponent}
        isOpen={Boolean(detailComponent)}
        onClose={() => setDetailComponent(null)}
      />
    </section>
  );
}
