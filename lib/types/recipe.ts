import { DifficultyLevel } from "./component";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  domain: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  projectTypes: string[];
  components: string[];
  recommended?: string[];
  learningGoals: string[];
  expectedOutputs: string[];
  starterCommands: string[];
  warnings: string[];
}

export interface RecipeMatch {
  recipe: Recipe;
  score: number; // Match affinity score 0 - 100
}
