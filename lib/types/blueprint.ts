import { Component, DifficultyLevel } from "./component";
import type { ProjectDefinition } from "./project";
import type { ArchitectureSpecification } from "./architecture";
import type { ArchitectureValidationReport } from "./architecture-validation";
import type { DevelopmentPlan } from "./development-plan";

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
  architecture?: ArchitectureSpecification;
  architectureValidation?: ArchitectureValidationReport;
  developmentPlan?: DevelopmentPlan;
  validation?: {
    valid: boolean;
    score: number;
    status: string;
    missingDependencies: string[];
    conflicts: string[];
  };
}
