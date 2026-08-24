"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Clock, Trophy } from "lucide-react";

export function RecipeRecommendations() {
  const { recipeRecommendations, loadRecipe, selectedComponents } = useTechStack();

  if (selectedComponents.length === 0) return null;

  return (
    <div id="recipes" className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Recommended Recipes
        </h3>
        <Badge variant="outline" className="text-[10px] font-mono">
          {recipeRecommendations.length} Matches
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipeRecommendations.slice(0, 4).map(({ recipe, score }) => (
          <Card key={recipe.id} className="group overflow-hidden hover:border-primary/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
                  {recipe.domain.replace("-", " ")}
                </Badge>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Trophy className="w-3 h-3" />
                  {score}% Affinity
                </div>
              </div>
              <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">
                {recipe.title}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {recipe.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{recipe.estimatedHours}h
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{recipe.difficulty}</span>
              </div>
              <Button 
                onClick={() => loadRecipe(recipe.id)}
                className="w-full h-8 text-xs gap-1.5"
              >
                Apply This Recipe <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
