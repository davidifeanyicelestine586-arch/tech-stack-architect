import { Component, DifficultyLevel } from "./component";

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
}
