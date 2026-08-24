import type { DifficultyLevel, Component } from "./component";
import type { RecipeMatch } from "./recipe";

export interface ProjectDefinition {
  name: string;
  description: string;
  domain: string;
  difficulty: DifficultyLevel;
  requirements: string;
}

export interface ComponentRecommendation {
  component: Component;
  score: number;
  matchedTerms: string[];
  reasons: string[];
  dependencies: string[];
  unregisteredDependencies: string[];
  declaredConflicts: string[];
  compatible: boolean;
}

export interface RequirementAnalysis {
  project: ProjectDefinition;
  matchedTerms: string[];
  recommendations: ComponentRecommendation[];
  recipeMatches: RecipeMatch[];
}
