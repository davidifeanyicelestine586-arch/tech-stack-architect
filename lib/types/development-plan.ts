export interface DevelopmentMilestone {
  id: string;
  title: string;
  description: string;
  completionCriteria: string[];
}

export interface DevelopmentPhase {
  id: string;
  title: string;
  objective: string;
  deliverables: string[];
  dependsOn: string[];
  milestoneIds: string[];
  taskIds: string[];
}

export interface DevelopmentTask {
  id: string;
  title: string;
  description: string;
  phaseId: string;
  componentIds: string[];
  dependsOn: string[];
  acceptanceCriteria: string[];
  deliverables: string[];
  suggestedTests: string[];
  learningResources: string[];
}

export interface DevelopmentPlan {
  schemaVersion: 1;
  sourceSignature: string;
  milestones: DevelopmentMilestone[];
  phases: DevelopmentPhase[];
  tasks: DevelopmentTask[];
}
