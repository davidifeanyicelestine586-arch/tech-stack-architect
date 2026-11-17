export type ArchitectureFindingSeverity = "error" | "warning" | "info";

export interface ArchitectureValidationFinding {
  id: string;
  severity: ArchitectureFindingSeverity;
  code: string;
  title: string;
  location: string;
  explanation: string;
  evidence: string[];
  recommendation: string;
}

export interface ArchitectureValidationReport {
  valid: boolean;
  score: number;
  status: "Needs attention" | "Review recommended" | "No structural issues detected";
  summary: string;
  findings: ArchitectureValidationFinding[];
}
