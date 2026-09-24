import type {
  Blueprint,
  Component,
  Domain,
  MergedReport,
  Recipe,
  RecipeMatch,
  RequirementAnalysis,
  ValidationReport,
} from "@/lib/types";

export interface TechStackArchitectConfig {
  domains?: Domain[];
  components?: Component[];
  recipes?: Recipe[];
}

export interface TechStackArchitectBuildResult {
  blueprint: Blueprint | null;
  report: ValidationReport;
}

export default class TechStackArchitect {
  constructor(config?: TechStackArchitectConfig);

  getDomains(): Domain[];
  getComponents(): Component[];
  getComponentsByDomain(domain: string): Component[];
  getRecipes(): Recipe[];
  getRecipe(id: string): Recipe | null;
  recommendRecipes(selected: string[]): RecipeMatch[];
  analyzeRequirements(project: Parameters<TechStackArchitect["analyzeRequirements"]>[0]): RequirementAnalysis;
  validate(selected: string[]): ValidationReport;
  resolveMissingDependencies(selected: string[]): string[];
  build(input: {
    recipe?: string | null;
    selectedComponents?: string[];
  }): TechStackArchitectBuildResult;
  exportJSON(report: MergedReport): string;
  exportMarkdown(report: MergedReport): string;
  export(format: string, report: MergedReport): string;
  downloadJSON(filename: string, report: MergedReport): void;
  downloadMarkdown(filename: string, report: MergedReport): void;
  download(format: string, filename: string, report: MergedReport): void;
}
