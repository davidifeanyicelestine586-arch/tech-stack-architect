export interface ArchitectureComponent {
  id: string;
  name: string;
  type: string;
  responsibility: string;
  technologyIds: string[];
}

export interface ArchitectureRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  description: string;
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  status: "proposed" | "approved";
  alternatives: string[];
}

export interface ArchitectureSpecification {
  schemaVersion: 1;
  sourceSignature: string;
  components: ArchitectureComponent[];
  relationships: ArchitectureRelationship[];
  decisions: ArchitectureDecision[];
  assumptions: string[];
  unresolvedQuestions: string[];
}

export interface ArchitectureGenerationAnswers {
  architectureStyle?: "modular-monolith" | "service-oriented" | "serverless";
  deploymentModel?: "single-deployment" | "distributed" | "serverless";
  architectureStyleApproved?: boolean;
  deploymentModelApproved?: boolean;
  dataFlowReviewed?: boolean;
  securityReviewed?: boolean;
  assumptions?: string[];
}
