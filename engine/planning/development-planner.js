const FOUNDATION_TYPES = new Set([
  "Runtime",
  "Hosting",
  "Operating System",
  "Interface",
  "Power",
  "Storage",
]);
const INTEGRATION_TYPES = new Set([
  "Protocol",
  "Workflow",
  "AI Gateway",
  "Security",
  "Orchestration",
  "Payments",
  "Sensor",
  "Actuator",
  "Motor Driver",
]);

const slug = (value) =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const task = ({ id, title, description, phaseId, componentIds = [], dependsOn = [], acceptanceCriteria, deliverables, suggestedTests = [], learningResources = [] }) => ({
  id,
  title,
  description,
  phaseId,
  componentIds,
  dependsOn,
  acceptanceCriteria,
  deliverables,
  suggestedTests,
  learningResources,
});

export const getDevelopmentPlanSourceSignature = (project, architecture) =>
  JSON.stringify({
    project: {
      name: project?.name || "",
      description: project?.description || "",
      domain: project?.domain || "",
      difficulty: project?.difficulty || "",
      requirements: project?.requirements || "",
    },
    architecture,
  });

export const generateDevelopmentPlan = ({ project, architecture, validation }) => {
  if (!project || typeof project !== "object") {
    throw new Error("A project definition is required to generate a development plan.");
  }
  if (!architecture || !Array.isArray(architecture.components) || architecture.components.length === 0) {
    throw new Error("Generate and review an architecture before creating the development plan.");
  }

  const components = architecture.components;
  const groups = [
    { id: "foundation", title: "Project foundation", objective: "Prepare the runtime, hosting, and foundational capabilities.", components: components.filter((item) => FOUNDATION_TYPES.has(item.type)) },
    { id: "core", title: "Core implementation", objective: "Implement the main application responsibilities and data capabilities.", components: components.filter((item) => !FOUNDATION_TYPES.has(item.type) && !INTEGRATION_TYPES.has(item.type)) },
    { id: "integrations", title: "Integrations and controls", objective: "Connect external capabilities and apply the required operational controls.", components: components.filter((item) => INTEGRATION_TYPES.has(item.type)) },
  ].filter((group) => group.components.length > 0 || group.id === "foundation");

  const phases = [];
  const milestones = [];
  const tasks = [];
  const projectScopeTaskId = "task-confirm-project-scope";
  const foundation = groups[0];
  const foundationTaskIds = [projectScopeTaskId];

  tasks.push(task({
    id: projectScopeTaskId,
    title: "Confirm project scope and constraints",
    description: `Confirm the goals, requirements, constraints, and assumptions for ${project.name || "the project"} before implementation begins.`,
    phaseId: foundation.id,
    acceptanceCriteria: [
      "Project goals and requirements have been reviewed.",
      "Open assumptions and unresolved decisions are documented.",
    ],
    deliverables: ["Approved project scope and assumptions"],
    suggestedTests: ["Review the project specification with the intended users or project owner."],
    learningResources: ["Review the project specification and selected technology documentation."],
  }));

  const phaseTaskIds = new Map([[foundation.id, foundationTaskIds]]);
  const previousPhaseIds = [];
  const previousTaskIds = [projectScopeTaskId];

  for (const group of groups) {
    const groupTasks = phaseTaskIds.get(group.id) || [];
    for (const component of group.components) {
      const taskId = `task-${slug(component.id)}`;
      groupTasks.push(taskId);
      tasks.push(task({
        id: taskId,
        title: `Implement ${component.name}`,
        description: `Implement the ${component.type} responsibility: ${component.responsibility}`,
        phaseId: group.id,
        componentIds: [component.id],
        dependsOn: group.id === "foundation" ? [projectScopeTaskId] : [...previousTaskIds],
        acceptanceCriteria: [
          `${component.name} fulfils its documented responsibility.`,
          "Configuration and failure behaviour are documented.",
          "The implementation is covered by an appropriate automated or repeatable check.",
        ],
        deliverables: [`${component.name} implementation and configuration`],
        suggestedTests: [
          `Add a focused test for the ${component.name} responsibility.`,
          "Verify the component's declared dependencies and failure handling.",
        ],
        learningResources: [`Review the registered documentation for ${component.name}.`],
      }));
    }
    phaseTaskIds.set(group.id, groupTasks);
    const milestoneId = `milestone-${group.id}`;
    milestones.push({
      id: milestoneId,
      title: `${group.title} complete`,
      description: group.objective,
      completionCriteria: [
        group.objective,
        "All phase tasks meet their acceptance criteria.",
      ],
    });
    phases.push({
      id: group.id,
      title: group.title,
      objective: group.objective,
      deliverables: groupTasks.map((id) => tasks.find((item) => item.id === id)?.title).filter(Boolean),
      dependsOn: [...previousPhaseIds],
      milestoneIds: [milestoneId],
      taskIds: groupTasks,
    });
    previousPhaseIds.push(group.id);
    previousTaskIds.push(...groupTasks.filter((id) => id !== projectScopeTaskId));
  }

  const verificationPhaseId = "verification";
  const validationFindings = Array.isArray(validation?.findings) ? validation.findings : [];
  const validationTaskIds = [];
  for (const item of validationFindings.filter((finding) => finding.severity === "error" || finding.severity === "warning")) {
    const taskId = `task-address-${slug(item.code)}`;
    validationTaskIds.push(taskId);
    const matchingComponent = components.find((component) => component.name === item.location);
    tasks.push(task({
      id: taskId,
      title: `Address: ${item.title}`,
      description: item.explanation,
      phaseId: verificationPhaseId,
      componentIds: matchingComponent ? [matchingComponent.id] : [],
      dependsOn: [...new Set(previousTaskIds)],
      acceptanceCriteria: [
        item.recommendation,
        "Repeat architecture validation and confirm the finding is resolved or explicitly accepted.",
      ],
      deliverables: [`Resolution record for ${item.code}`],
      suggestedTests: ["Add or update a test that covers the affected architecture rule."],
      learningResources: ["Review the evidence and recommendation in the architecture validation report."],
    }));
  }
  const verificationTaskId = "task-integrated-verification";
  const verificationMilestoneId = "milestone-verification";
  tasks.push(task({
    id: verificationTaskId,
    title: "Verify the integrated architecture",
    description: "Verify that the implemented components work together and that architecture findings have been reviewed.",
    phaseId: verificationPhaseId,
    componentIds: components.map((item) => item.id),
    dependsOn: [...new Set([...previousTaskIds, ...validationTaskIds])],
    acceptanceCriteria: [
      "The selected architecture components are integrated.",
      "Critical user journeys pass their end-to-end checks.",
      "Architecture validation findings are resolved or explicitly accepted.",
    ],
    deliverables: ["Integrated application verification report"],
    suggestedTests: [
      "Run unit, integration, and end-to-end tests for the critical project journeys.",
      "Repeat architecture validation after implementation changes.",
    ],
    learningResources: ["Review the project's testing and release guidance."],
  }));
  milestones.push({
    id: verificationMilestoneId,
    title: "Integrated verification complete",
    description: "Confirm the project meets its acceptance criteria.",
    completionCriteria: [
      "Critical end-to-end checks pass.",
      "No unresolved blocking architecture findings remain.",
    ],
  });
  phases.push({
    id: verificationPhaseId,
    title: "Verification and handoff",
    objective: "Verify the integrated project and prepare the engineering handoff.",
    deliverables: ["Integrated application verification report"],
    dependsOn: [...previousPhaseIds],
    milestoneIds: [verificationMilestoneId],
    taskIds: [...validationTaskIds, verificationTaskId],
  });

  if (validationFindings.some((item) => item.severity === "error")) {
    const reviewTask = tasks.find((item) => item.id === verificationTaskId);
    reviewTask.description += ` Blocking architecture findings remain: ${validationFindings.filter((item) => item.severity === "error").map((item) => item.title).join("; ")}.`;
  }

  return { schemaVersion: 1, sourceSignature: getDevelopmentPlanSourceSignature(project, architecture), milestones, phases, tasks };
};
