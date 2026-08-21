import { Component } from "./component";

export type BuildStatus =
  | "Production Ready"
  | "Good"
  | "Needs Review"
  | "High Risk"
  | "Invalid Configuration"
  | "Unknown";

export interface ComponentConflictItem {
  source: string;
  target: string;
  reason: string;
}

export interface PinConflictItem {
  pin: number | string;
  components: string[];
  severity: "low" | "medium" | "high";
  recommendation: string;
}

export interface RuleViolationItem {
  rule: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export interface ConflictReport {
  hasConflicts: boolean;
  duplicates: string[];
  componentConflicts: ComponentConflictItem[];
  pinConflicts: PinConflictItem[];
  ruleViolations: RuleViolationItem[];
}

export interface DependencyReport {
  selected: string[];
  required: string[];
  optional: string[];
  missing: string[];
}

export interface WarningItem {
  component: string;
  severity: "warning" | "error" | "info";
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  score: number;
  status: BuildStatus;
  domains: Record<string, number>;
  dependencyReport: DependencyReport;
  conflictReport: ConflictReport;
  warnings: WarningItem[];
  suggestions: string[];
  timestamp: string;
}

export interface MergedReport {
  title: string;
  score?: number;
  status?: BuildStatus;
  domain: string;
  components: Component[];
  warnings: (WarningItem | string)[];
  suggestions: string[];
  starterCommands: string[];
  learningGoals: string[];
  outputs: string[];
}
