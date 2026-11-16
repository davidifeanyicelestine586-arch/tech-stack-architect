const categorySet = (selectedComponents) =>
  new Set(selectedComponents.filter((component) => component && typeof component === "object").map((component) => component.category).filter(Boolean));

const hasCategory = (categories, names) =>
  names.some((name) => categories.has(name));

const finding = (severity, code, title, location, explanation, evidence, recommendation) => ({
  id: code.toLowerCase().replace(/[^a-z0-9-]+/g, "-") + "-" + String(location).toLowerCase().replace(/[^a-z0-9-]+/g, "-") + "-" + String(evidence.join("-") || "finding").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
  severity,
  code,
  title,
  location,
  explanation,
  evidence,
  recommendation,
});

export const validateArchitecture = ({ project, architecture, selectedComponents }) => {
  const findings = [];
  const selected = Array.isArray(selectedComponents) ? selectedComponents.filter((component) => component && typeof component === "object") : [];
  const selectedById = new Map(selected.filter((component) => typeof component.id === "string").map((component) => [component.id, component]));
  const architectureComponents = Array.isArray(architecture?.components) ? architecture.components : [];
  const relationships = Array.isArray(architecture?.relationships) ? architecture.relationships : [];
  const componentById = new Map(architectureComponents.filter((component) => component && typeof component === "object" && typeof component.id === "string").map((component) => [component.id, component]));
  const technologyToArchitectureId = new Map();

  if (!architecture || !Array.isArray(architecture.components) || !Array.isArray(architecture.relationships)) {
    findings.push(finding(
      "error",
      "INVALID_ARCHITECTURE",
      "Architecture structure is incomplete",
      "Architecture",
      "The architecture must include component and relationship collections before it can be validated.",
      [],
      "Generate the architecture again or restore a valid architecture specification."
    ));
  }

  for (const component of architectureComponents) {
    if (!component?.id || !component?.name || !Array.isArray(component.technologyIds)) {
      findings.push(finding(
        "error",
        "INVALID_ARCHITECTURE_COMPONENT",
        "Architecture component is incomplete",
        component?.name || "Architecture component",
        "Every architecture component requires an ID, name, and technology assignments.",
        [],
        "Complete the component details and assign registered technologies."
      ));
      continue;
    }
    for (const technologyId of component.technologyIds) {
      if (!selectedById.has(technologyId)) {
        findings.push(finding(
          "error",
          "UNKNOWN_OR_UNSELECTED_TECHNOLOGY",
          "Technology assignment is not in the selected stack",
          component.name,
          `The architecture references ${technologyId}, which is not in the current selected stack.`,
          [technologyId],
          "Add the technology to the selected stack or remove the assignment from this component."
        ));
      }
      technologyToArchitectureId.set(technologyId, component.id);
    }
  }

  const connected = new Set();
  const relationshipKeys = new Set();
  for (const relationship of relationships) {
    if (!componentById.has(relationship?.sourceId) || !componentById.has(relationship?.targetId)) {
      findings.push(finding(
        "error",
        "INVALID_RELATIONSHIP_TARGET",
        "Relationship points to a missing component",
        relationship?.id || "Relationship",
        "Every relationship must connect two components that exist in the current architecture.",
        [relationship?.sourceId || "missing source", relationship?.targetId || "missing target"],
        "Reconnect the relationship to existing architecture components or remove it."
      ));
      continue;
    }
    if (relationship.sourceId === relationship.targetId) {
      findings.push(finding(
        "error",
        "SELF_REFERENCING_RELATIONSHIP",
        "Component cannot depend on itself",
        relationship.id,
        "A relationship currently connects a component to itself.",
        [relationship.sourceId],
        "Remove the self-reference or connect the component to its actual dependency."
      ));
      continue;
    }
    connected.add(relationship.sourceId);
    connected.add(relationship.targetId);
    relationshipKeys.add(`${relationship.sourceId}:${relationship.targetId}`);
  }

  for (const technology of selected) {
    const sourceId = technologyToArchitectureId.get(technology.id);
    if (!sourceId) {
      findings.push(finding(
        "warning",
        "TECHNOLOGY_NOT_MAPPED",
        "Selected technology is not represented in the architecture",
        technology.name,
        "The selected stack contains a technology that has no architecture component assignment.",
        [technology.id],
        "Add this technology to an appropriate architecture component or remove it from the stack."
      ));
      continue;
    }
    for (const requiredId of technology.requires || []) {
      if (!selectedById.has(requiredId)) {
        findings.push(finding(
          "error",
          "MISSING_TECHNOLOGY_DEPENDENCY",
          "Required technology is missing",
          technology.name,
          `${technology.name} declares ${requiredId} as a dependency, but it is not selected.`,
          [technology.id, requiredId],
          "Add the required technology or choose a compatible alternative."
        ));
        continue;
      }
      const targetId = technologyToArchitectureId.get(requiredId);
      if (targetId && !relationshipKeys.has(`${sourceId}:${targetId}`)) {
        findings.push(finding(
          "warning",
          "DEPENDENCY_RELATIONSHIP_MISSING",
          "Declared dependency is not represented as a relationship",
          technology.name,
          `The catalog declares a dependency on ${requiredId}, but the architecture graph does not show that relationship.`,
          [technology.id, requiredId],
          "Add the dependency relationship so the architecture communicates the declared requirement."
        ));
      }
    }
  }

  for (const component of architectureComponents) {
    if (!connected.has(component.id)) {
      findings.push(finding(
        "info",
        "UNCONNECTED_COMPONENT",
        "Component has no declared relationship",
        component.name,
        "No dependency relationship currently connects this component to another architecture component.",
        component.technologyIds || [],
        "Confirm whether this component communicates with another component and document the interface if it does."
      ));
    }
  }

  const requirements = `${project?.name || ""} ${project?.description || ""} ${project?.requirements || ""}`;
  const categories = categorySet(selected);
  if (/(store|database|persist|upload|file|record|document)/i.test(requirements) &&
      !hasCategory(categories, ["Database", "Storage", "Backend Platform"])) {
    findings.push(finding(
      "warning",
      "DATA_PERSISTENCE_COVERAGE",
      "Data persistence capability is not represented",
      "Data layer",
      "The project requirements mention data or files, but the selected stack does not identify a database, storage, or backend platform.",
      [project?.requirements || ""],
      "Choose a suitable persistence technology and document ownership, retention, and access paths."
    ));
  }

  if (/(auth|login|sign.?up|account|identity|authorization)/i.test(requirements) &&
      !hasCategory(categories, ["Security", "Backend Platform"])) {
    findings.push(finding(
      "warning",
      "AUTHENTICATION_COVERAGE",
      "Identity and access capability needs a decision",
      "Identity and access",
      "The project mentions identity or authentication, but no selected security or backend platform capability is represented.",
      [project?.requirements || ""],
      "Select an identity/authentication capability and define authentication and authorization boundaries."
    ));
  }

  if (/(payment|billing|subscription|checkout)/i.test(requirements) &&
      !hasCategory(categories, ["Payments"])) {
    findings.push(finding(
      "warning",
      "PAYMENT_COVERAGE",
      "Payment capability is not represented",
      "Payments",
      "The project mentions billing or payments, but the selected stack has no registered payments technology.",
      [project?.requirements || ""],
      "Select a payment provider and document checkout, webhook, and subscription responsibilities."
    ));
  }

  if (/(integrat|webhook|external|third.party)/i.test(requirements) &&
      !hasCategory(categories, ["Protocol", "Backend Platform", "Orchestration", "Workflow"])) {
    findings.push(finding(
      "warning",
      "INTEGRATION_COVERAGE",
      "External integration capability needs a decision",
      "Integrations",
      "The project mentions external integrations, but no protocol, backend, or orchestration capability is represented.",
      [project?.requirements || ""],
      "Identify the external systems and define their protocols, credentials, retries, and failure handling."
    ));
  }

  if (Array.isArray(architecture?.unresolvedQuestions) && architecture.unresolvedQuestions.length > 0) {
    findings.push(finding(
      "info",
      "UNRESOLVED_ARCHITECTURE_QUESTIONS",
      "Architecture still has unresolved questions",
      "Architecture review",
      `${architecture.unresolvedQuestions.length} architecture question(s) remain unanswered.`,
      architecture.unresolvedQuestions,
      "Resolve or explicitly accept each open question before treating this architecture as an implementation baseline."
    ));
  }

  const errors = findings.filter((item) => item.severity === "error").length;
  const warnings = findings.filter((item) => item.severity === "warning").length;
  const score = Math.max(0, 100 - errors * 25 - warnings * 10 - findings.filter((item) => item.severity === "info").length * 2);
  const status = errors > 0
    ? "Needs attention"
    : warnings > 0
      ? "Review recommended"
      : "No structural issues detected";

  return {
    valid: errors === 0,
    score,
    status,
    summary: findings.length === 0
      ? "No structural issues were found by the registered architecture checks."
      : `Found ${errors} error(s), ${warnings} warning(s), and ${findings.length - errors - warnings} informational finding(s).`,
    findings,
  };
};
