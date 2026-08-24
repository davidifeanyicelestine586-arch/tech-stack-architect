const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "application",
  "as",
  "be",
  "by",
  "for",
  "from",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "the",
  "to",
  "users",
  "we",
  "with",
]);

const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum);

export const createProjectDefinition = (input = {}) => ({
  name: String(input.name || "").trim(),
  description: String(input.description || "").trim(),
  domain: String(input.domain || "web-saas"),
  difficulty: ["Beginner", "Intermediate", "Advanced"].includes(input.difficulty)
    ? input.difficulty
    : "Intermediate",
  requirements: String(input.requirements || "").trim(),
});

export const validateProjectDefinition = (project) => {
  const errors = [];
  if (!project.name) errors.push("Project name is required.");
  if (!project.description) errors.push("Project description is required.");
  if (!project.domain) errors.push("Project domain is required.");

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const normalizeTerms = (value = "") =>
  Array.from(
    new Set(
      String(value)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2 && !STOP_WORDS.has(term))
    )
  );

const metadataText = (value) => {
  if (Array.isArray(value)) return value.join(" ");
  return value || "";
};

export default class RequirementAnalyzer {
  constructor({ domains = [], components = [], recipes = [] } = {}) {
    this.domains = domains;
    this.components = components;
    this.recipes = recipes;
    this.componentIds = new Set(components.map((component) => component.id));
  }

  getDeclaredConflicts(componentId) {
    const conflicts = new Set();
    const component = this.components.find((item) => item.id === componentId);

    (component?.conflicts || []).forEach((conflict) => {
      conflicts.add(typeof conflict === "string" ? conflict : conflict.component);
    });

    this.components.forEach((item) => {
      (item.conflicts || []).forEach((conflict) => {
        const target = typeof conflict === "string" ? conflict : conflict.component;
        if (target === componentId) conflicts.add(item.id);
      });
    });

    return Array.from(conflicts).sort();
  }

  getDomainTitle(domainId) {
    return this.domains.find((domain) => domain.id === domainId)?.title || domainId;
  }

  scoreRecipe(recipe, projectTerms, projectDomain) {
    const recipeTerms = normalizeTerms(
      [
        recipe.title,
        recipe.description,
        recipe.domain,
        recipe.projectTypes,
        recipe.learningGoals,
        recipe.expectedOutputs,
      ]
        .map(metadataText)
        .join(" ")
    );
    const matchedTerms = projectTerms.filter((term) => recipeTerms.includes(term));
    const domainScore = recipe.domain === projectDomain ? 25 : 0;
    const termScore = clamp(matchedTerms.length * 15, 0, 75);

    return {
      recipe,
      score: clamp(domainScore + termScore, 0, 100),
    };
  }

  analyze(project) {
    const projectText = [
      project.name,
      project.description,
      project.domain,
      project.requirements,
    ]
      .filter(Boolean)
      .join(" ");
    const projectTerms = normalizeTerms(projectText);
    const domainTitle = this.getDomainTitle(project.domain);
    const recipeMatches = this.recipes
      .map((recipe) => this.scoreRecipe(recipe, projectTerms, project.domain))
      .sort((left, right) => right.score - left.score || left.recipe.id.localeCompare(right.recipe.id));

    const recommendations = this.components
      .map((component) => {
        const componentTerms = normalizeTerms(
          [
            component.name,
            component.description,
            component.category,
            component.domain,
            component.requires,
            component.optional,
            component.supports,
            component.outputs,
            component.tags,
          ]
            .map(metadataText)
            .join(" ")
        );
        const matchedTerms = projectTerms.filter((term) => componentTerms.includes(term));
        const domainMatch = component.domain === project.domain;
        const difficultyMatch = component.difficulty === project.difficulty;
        const relatedRecipe = recipeMatches.find(
          ({ recipe, score }) =>
            score > 0 &&
            ((recipe.components || []).includes(component.id) ||
              (recipe.recommended || []).includes(component.id))
        );
        const recipeScore = relatedRecipe ? Math.min(10, Math.round(relatedRecipe.score / 10)) : 0;
        const dependencies = component.requires || [];
        const declaredConflicts = this.getDeclaredConflicts(component.id);
        const unregisteredDependencies = dependencies.filter(
          (dependency) => !this.componentIds.has(dependency)
        );
        const dependencyScore = unregisteredDependencies.length === 0 ? 5 : -10;
        const score = clamp(
          (domainMatch ? 25 : 0) +
            Math.min(40, matchedTerms.length * 10) +
            (difficultyMatch ? 15 : 0) +
            recipeScore +
            dependencyScore,
          0,
          100
        );
        const reasons = [];

        if (domainMatch) reasons.push(`Matches the selected domain: ${domainTitle}.`);
        if (matchedTerms.length > 0) {
          reasons.push(`Matches project terms: ${matchedTerms.join(", ")}.`);
        }
        if (difficultyMatch) {
          reasons.push(`Matches the ${project.difficulty} difficulty preference.`);
        }
        if (relatedRecipe) {
          reasons.push(`Relates to the ${relatedRecipe.recipe.title} recipe metadata.`);
        }
        if (unregisteredDependencies.length === 0) {
          reasons.push("All required dependencies exist in the registry.");
        } else {
          reasons.push(`Requires unregistered dependencies: ${unregisteredDependencies.join(", ")}.`);
        }
        if (declaredConflicts.length > 0) {
          reasons.push(`Has declared registry conflicts with: ${declaredConflicts.join(", ")}.`);
        }
        if (reasons.length === 0) {
          reasons.push("Included because it is a registered component available for evaluation.");
        }

        return {
          component,
          score,
          matchedTerms,
          reasons,
          dependencies,
          unregisteredDependencies,
          declaredConflicts,
          compatible:
            unregisteredDependencies.length === 0 && declaredConflicts.length === 0,
        };
      })
      .filter((recommendation) => recommendation.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.component.name.localeCompare(right.component.name)
      );

    const matchedTerms = Array.from(
      new Set(recommendations.flatMap((recommendation) => recommendation.matchedTerms))
    );

    return {
      project,
      matchedTerms,
      recommendations,
      recipeMatches,
    };
  }
}
