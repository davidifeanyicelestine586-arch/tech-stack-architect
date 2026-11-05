import { NAVIGATION_ROUTE_BY_ID } from "@/lib/navigation/routes";

export const WORKFLOW_STEPS = [
  { id: "define", label: "Define", routeId: "define" },
  { id: "analyze", label: "Analyze", routeId: "define" },
  { id: "review", label: "Review", routeId: "recommendations" },
  { id: "build", label: "Build", routeId: "components" },
  { id: "validate", label: "Validate", routeId: "validation" },
  { id: "blueprint", label: "Blueprint", routeId: "blueprint" },
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
  return NAVIGATION_ROUTE_BY_ID[step.routeId].href;
}
