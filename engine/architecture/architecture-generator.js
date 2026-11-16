const ARCHITECTURE_STYLES = {
  "modular-monolith": {
    label: "Modular monolith",
    rationale: "Keep the first release cohesive while separating responsibilities into explicit modules.",
  },
  "service-oriented": {
    label: "Service-oriented",
    rationale: "Separate independently owned capabilities where operational boundaries justify them.",
  },
  serverless: {
    label: "Serverless",
    rationale: "Prefer managed execution and hosting boundaries where the selected stack supports them.",
  },
};

const DEPLOYMENT_MODELS = {
  "single-deployment": {
    label: "Single deployment",
    rationale: "Deploy the selected application as one coordinated release unit.",
  },
  distributed: {
    label: "Distributed deployment",
    rationale: "Treat independently deployed components as separate operational units.",
  },
  serverless: {
    label: "Managed serverless deployment",
    rationale: "Use managed hosting and execution services represented in the selected stack.",
  },
};

const toArchitectureId = (technologyId) =>
  `technology-${String(technologyId).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`;

const requireSelectedComponents = (selectedComponents) => {
  if (!Array.isArray(selectedComponents) || selectedComponents.length === 0) {
    throw new Error("Select at least one registered technology before generating architecture.");
  }
  const ids = selectedComponents.map((component) => component?.id);
  if (ids.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error("Every selected technology must have a valid registry ID.");
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("Selected technologies must have unique registry IDs.");
  }
};

export const generateArchitecture = ({
  project,
  selectedComponents,
  answers = {},
}) => {
  requireSelectedComponents(selectedComponents);
  if (!project || typeof project !== "object") {
    throw new Error("A project definition is required to generate architecture.");
  }

  const selectedById = new Map(selectedComponents.map((component) => [component.id, component]));
  const components = selectedComponents.map((technology) => ({
    id: toArchitectureId(technology.id),
    name: technology.name,
    type: technology.category || "Technology",
    responsibility: technology.description || `Provide the capability represented by ${technology.name}.`,
    technologyIds: [technology.id],
  }));
  const architectureIdByTechnologyId = new Map(
    selectedComponents.map((technology) => [technology.id, toArchitectureId(technology.id)])
  );

  const relationships = [];
  const unresolvedQuestions = [];
  for (const technology of selectedComponents) {
    for (const requiredId of technology.requires || []) {
      const dependency = selectedById.get(requiredId);
      if (!dependency) {
        unresolvedQuestions.push(
          `Confirm how ${technology.name} will satisfy its declared dependency on ${requiredId}.`
        );
        continue;
      }
      relationships.push({
        id: `requires-${technology.id}-${requiredId}`,
        sourceId: architectureIdByTechnologyId.get(technology.id),
        targetId: architectureIdByTechnologyId.get(requiredId),
        relationshipType: "requires",
        description: `${technology.name} declares ${dependency.name} as a required technology.`,
      });
    }
  }

  const style = ARCHITECTURE_STYLES[answers.architectureStyle]
    ? answers.architectureStyle
    : "modular-monolith";
  const deployment = DEPLOYMENT_MODELS[answers.deploymentModel]
    ? answers.deploymentModel
    : "single-deployment";

  const decisions = [
    {
      id: "decision-architecture-style",
      title: "Architecture style",
      decision: ARCHITECTURE_STYLES[style].label,
      rationale: ARCHITECTURE_STYLES[style].rationale,
      alternatives: Object.values(ARCHITECTURE_STYLES)
        .map((item) => item.label)
        .filter((label) => label !== ARCHITECTURE_STYLES[style].label),
    },
    {
      id: "decision-deployment-model",
      title: "Deployment model",
      decision: DEPLOYMENT_MODELS[deployment].label,
      rationale: DEPLOYMENT_MODELS[deployment].rationale,
      alternatives: Object.values(DEPLOYMENT_MODELS)
        .map((item) => item.label)
        .filter((label) => label !== DEPLOYMENT_MODELS[deployment].label),
    },
    ...selectedComponents.map((technology) => ({
      id: `decision-technology-${technology.id}`,
      title: `Technology assignment: ${technology.name}`,
      decision: `Assign ${technology.name} to the ${technology.category || "technology"} responsibility.`,
      rationale: technology.description || "Selected from the registered technology catalog.",
      alternatives: [],
    })),
  ];

  const assumptions = [
    "Components are derived only from the technologies selected in this project.",
    "Relationships represent declared registry dependencies; runtime communication paths still require review.",
    `The initial architecture style is ${ARCHITECTURE_STYLES[style].label}; confirm this proposal before implementation.`,
    `The initial deployment model is ${DEPLOYMENT_MODELS[deployment].label}; confirm operational boundaries before implementation.`,
    ...(Array.isArray(answers.assumptions) ? answers.assumptions.filter((item) => typeof item === "string" && item.trim()) : []),
  ];

  if (relationships.length === 0) {
    unresolvedQuestions.push("Which components exchange requests, events, or data, and through which interfaces?");
  } else {
    unresolvedQuestions.push("Review whether the declared dependencies reflect every required runtime communication path.");
  }
  if (!answers.dataFlowReviewed) {
    unresolvedQuestions.push("Confirm the data flow, ownership, and persistence boundaries for this project.");
  }
  if (!answers.securityReviewed) {
    unresolvedQuestions.push("Confirm identity, authorization, secrets, and trust boundaries where applicable.");
  }

  return {
    schemaVersion: 1,
    components,
    relationships,
    decisions,
    assumptions,
    unresolvedQuestions: [...new Set(unresolvedQuestions)],
  };
};

export { ARCHITECTURE_STYLES, DEPLOYMENT_MODELS, toArchitectureId };
