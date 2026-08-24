import { Component, DifficultyLevel } from "./component";
import type { ProjectDefinition } from "./project";

export interface Blueprint {
  id: string;
  title: string;
  description: string;
  domain: string;
  difficulty: DifficultyLevel | string;
  estimatedHours: number;
  projectTypes?: string[];
  components: Component[];
  recommended?: string[];
  learningGoals: string[];
  outputs: string[];
  starterCommands: string[];
  warnings: string[];
  project?: ProjectDefinition;
  validation?: {
    valid: boolean;
    score: number;
    status: string;
    missingDependencies: string[];
    conflicts: string[];
  };
}
