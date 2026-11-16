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
  alternatives: string[];
}

export interface ArchitectureSpecification {
  schemaVersion: 1;
  components: ArchitectureComponent[];
  relationships: ArchitectureRelationship[];
  decisions: ArchitectureDecision[];
  assumptions: string[];
  unresolvedQuestions: string[];
}
