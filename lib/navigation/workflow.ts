export const WORKFLOW_STEPS = [
  { id: "define", label: "Define", href: "/app#define" },
  { id: "analyze", label: "Analyze", href: "/app#define" },
  { id: "review", label: "Review", href: "/app#recommendations" },
  { id: "build", label: "Build", href: "/app#components" },
  { id: "architect", label: "Architect", href: "/app#architect" },
  { id: "validate", label: "Validate", href: "/app#validation" },
  { id: "plan", label: "Plan", href: "/app#plan" },
  { id: "blueprint", label: "Blueprint", href: "/app#blueprint" },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"];

export function workflowStepNumber(id: WorkflowStepId): number {
  const index = WORKFLOW_STEPS.findIndex((step) => step.id === id);
  if (index < 0) throw new Error(`Unknown workflow step: ${id}`);
  return index + 1;
}

export function workflowStepLabel(id: WorkflowStepId): string {
  const step = WORKFLOW_STEPS.find((item) => item.id === id);
  if (!step) throw new Error(`Unknown workflow step: ${id}`);
  return `Step ${workflowStepNumber(id)} · ${step.label}`;
}

export function workflowStepHref(id: WorkflowStepId): string {
  const step = WORKFLOW_STEPS.find((item) => item.id === id);
  if (!step) throw new Error(`Unknown workflow step: ${id}`);
  return step.href;
}
