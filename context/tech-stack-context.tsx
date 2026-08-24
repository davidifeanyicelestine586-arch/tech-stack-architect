"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import TechStackArchitect from "@/engine/TechStackArchitect.js";
import domainsData from "@/data/domain.json";
import { createProjectPersistenceClient } from "@/lib/persistence/client/project-persistence-client.js";
import { createProviderPersistenceController } from "@/lib/persistence/client/provider-persistence.js";
import type { ProjectSnapshotV1 } from "@/lib/persistence/types";
import componentsData from "@/data/components.json";
import recipesData from "@/data/recipes.json";
import type {
  Domain,
  Component,
  Recipe,
  Blueprint,
  ValidationReport,
  MergedReport,
  RecipeMatch,
  ProjectDefinition,
  RequirementAnalysis,
} from "@/lib/types";

export type PersistenceStatus = "idle" | "saving" | "saved" | "loading" | "error";

export interface ProviderPersistenceErrorInfo {
  code: string;
  message: string;
}

export class ProviderPersistenceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ProviderPersistenceError";
    this.code = code;
  }
}

export interface SavedProjectSummary {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  domain: string;
  difficulty: string;
}


export interface TechStackContextType {
  // Data Registries
  domains: Domain[];
  components: Component[];
  recipes: Recipe[];
  categories: string[];

  // Active Filter States
  activeDomain: string;
  setActiveDomain: (domainId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  difficultyFilter: string;
  setDifficultyFilter: (difficulty: string) => void;

  // Project Definition & Analysis
  projectDefinition: ProjectDefinition;
  analyzeProject: (project: ProjectDefinition) => RequirementAnalysis;
  requirementAnalysis: RequirementAnalysis | null;
  ignoredRecommendationIds: string[];
  addRecommendation: (componentId: string) => void;
  addAllCompatibleRecommendations: () => void;
  ignoreRecommendation: (componentId: string) => void;

  // Selected State
  selectedComponentIds: string[];
  selectedComponents: Component[];
  toggleComponent: (id: string) => void;
  selectComponents: (ids: string[]) => void;
  removeComponent: (id: string) => void;
  clearSelection: () => void;
  resolveMissingDependencies: () => void;

  // Recipe & Blueprint State
  activeRecipeId: string | null;
  blueprint: Blueprint | null;
  loadRecipe: (recipeId: string) => void;
  generateCustomBlueprint: () => void;
  clearBlueprint: () => void;

  // Live Computed Reports
  validationReport: ValidationReport;
  recipeRecommendations: RecipeMatch[];
  mergedReport: MergedReport;
  filteredComponents: Component[];

  // UI Panel / Navigation States
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;

  // Export & Action Methods
  exportBlueprint: (format: "json" | "markdown") => string;
  downloadBlueprint: (format: "json" | "markdown", filename?: string) => void;
  copyBlueprint: (format: "json" | "markdown") => Promise<boolean>;

  // Programmatic persistence only; no visible project-management UI in this phase.
  currentProjectId: string | null;
  currentProjectRevision: number | null;
  persistenceStatus: PersistenceStatus;
  persistenceError: ProviderPersistenceErrorInfo | null;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  listProjects: () => Promise<SavedProjectSummary[]>;
  deleteProject: (projectId: string) => Promise<void>;
}

const TechStackContext = createContext<TechStackContextType | null>(null);

const toValidationSummary = (report: ValidationReport) => ({
  valid: report.valid,
  score: report.score,
  status: report.status,
  missingDependencies: report.dependencyReport.missing,
  conflicts: [
    ...report.conflictReport.componentConflicts.map(
      (conflict) => `${conflict.source} conflicts with ${conflict.target}: ${conflict.reason}`
    ),
    ...report.conflictReport.pinConflicts.map(
      (conflict) => `Pin ${conflict.pin} is shared by ${conflict.components.join(", ")}.`
    ),
    ...report.conflictReport.ruleViolations.map((violation) => violation.message),
  ],
});

export function TechStackProvider({ children }: { children: ReactNode }) {
  const domains = useMemo(() => domainsData as Domain[], []);
  const components = useMemo(() => componentsData as Component[], []);
  const recipes = useMemo(() => recipesData as Recipe[], []);

  // Initialize engine instance
  const architect = useMemo(() => {
    return new TechStackArchitect({
      domains,
      components,
      recipes,
    });
  }, [domains, components, recipes]);

  const persistenceClient = useMemo(
    () => createProjectPersistenceClient(),
    []
  );

  // UI & Filter States
  const [activeDomain, setActiveDomain] = useState<string>("all");
  const [projectDefinition, setProjectDefinition] = useState<ProjectDefinition>({
    name: "",
    description: "",
    domain: domains[0]?.id || "web-saas",
    difficulty: "Intermediate",
    requirements: "",
  });
  const [requirementAnalysis, setRequirementAnalysis] = useState<RequirementAnalysis | null>(null);
  const [ignoredRecommendationIds, setIgnoredRecommendationIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [activeTab, setActiveTab] = useState<string>("studio");
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectRevision, setCurrentProjectRevision] = useState<number | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("idle");
  const [persistenceError, setPersistenceError] = useState<ProviderPersistenceErrorInfo | null>(null);

  const getCanonicalSnapshot = useCallback(
    () => ({
      schemaVersion: 1 as const,
      projectDefinition,
      selectedComponentIds,
      activeRecipeId,
    }),
    [projectDefinition, selectedComponentIds, activeRecipeId]
  );

  // All distinct categories across components
  const categories = useMemo(() => {
    const set = new Set<string>();
    components.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [components]);

  // Selected Component Objects
  const selectedComponents = useMemo(() => {
    const idSet = new Set(selectedComponentIds);
    return components.filter((c) => idSet.has(c.id));
  }, [components, selectedComponentIds]);

  // Real-time Validation Report
  const validationReport = useMemo(() => {
    return architect.validate(selectedComponentIds) as ValidationReport;
  }, [architect, selectedComponentIds]);

  // Real-time Recipe Recommendations based on selected components
  const recipeRecommendations = useMemo(() => {
    return architect.recommendRecipes(selectedComponentIds) as RecipeMatch[];
  }, [architect, selectedComponentIds]);

  const analyzeProject = useCallback(
    (project: ProjectDefinition): RequirementAnalysis => {
      const normalizedProject = {
        ...project,
        name: project.name.trim(),
        description: project.description.trim(),
        requirements: project.requirements.trim(),
      };
      const analysis = architect.analyzeRequirements(normalizedProject);

      setProjectDefinition(normalizedProject);
      setActiveDomain(normalizedProject.domain);
      setRequirementAnalysis(analysis);
      setIgnoredRecommendationIds([]);
      setActiveRecipeId(null);
      setBlueprint(null);

      return analysis;
    },
    [architect]
  );

  const addRecommendation = useCallback((componentId: string) => {
    setSelectedComponentIds((previous) =>
      previous.includes(componentId) ? previous : [...previous, componentId]
    );
    setIgnoredRecommendationIds((previous) => previous.filter((id) => id !== componentId));
  }, []);

  const addAllCompatibleRecommendations = useCallback(() => {
    if (!requirementAnalysis) return;

    const additions = requirementAnalysis.recommendations
      .filter(
        (recommendation) =>
          recommendation.compatible &&
          !ignoredRecommendationIds.includes(recommendation.component.id)
      )
      .map((recommendation) => recommendation.component.id);

    setSelectedComponentIds((previous) =>
      Array.from(new Set([...previous, ...additions]))
    );
  }, [ignoredRecommendationIds, requirementAnalysis]);

  const ignoreRecommendation = useCallback((componentId: string) => {
    setIgnoredRecommendationIds((previous) =>
      previous.includes(componentId) ? previous : [...previous, componentId]
    );
  }, []);

  // Filtered Components List based on Domain, Category, Difficulty, and Search
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      // Domain filter
      if (activeDomain !== "all" && comp.domain !== activeDomain) {
        return false;
      }
      // Category filter
      if (selectedCategory !== "all" && comp.category !== selectedCategory) {
        return false;
      }
      // Difficulty filter
      if (difficultyFilter !== "all" && comp.difficulty !== difficultyFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = comp.name.toLowerCase().includes(query);
        const matchesDesc = comp.description.toLowerCase().includes(query);
        const matchesCategory = comp.category.toLowerCase().includes(query);
        const matchesTags = comp.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [components, activeDomain, selectedCategory, difficultyFilter, searchQuery]);

  // Custom Blueprint Generator
  const generateCustomBlueprint = useCallback(() => {
    const selectedObjects = selectedComponentIds
      .map((id) => components.find((c) => c.id === id))
      .filter(Boolean) as Component[];

    if (selectedObjects.length === 0) {
      setBlueprint(null);
      return;
    }

    const totalHours = selectedObjects.reduce(
      (sum, c) => sum + (c.estimatedLearningHours || 0),
      0
    );
    const maxComplexity = selectedObjects.reduce(
      (max, c) => Math.max(max, c.complexity || 1),
      1
    );

    let customDifficulty: "Beginner" | "Intermediate" | "Advanced" = "Beginner";
    if (maxComplexity >= 4) customDifficulty = "Advanced";
    else if (maxComplexity >= 3) customDifficulty = "Intermediate";

    const allOutputs = Array.from(
      new Set(selectedObjects.flatMap((c) => c.outputs || []))
    );
    const allLearningGoals = selectedObjects.map(
      (c) => `Master integration, security, and lifecycle of ${c.name} (${c.category})`
    );

    const commands = [
      "# ========================================================",
      "# Ediccrew Tech Stack Architect - Initializer Script",
      `# Stack: Custom ${activeDomain !== "all" ? activeDomain.toUpperCase() : "MULTI-DOMAIN"} Architecture`,
      "# ========================================================",
      "mkdir ediccrew-custom-stack",
      "cd ediccrew-custom-stack",
      "",
      "# 1. Initialize environment",
      "git init",
      "npm init -y",
      "",
      "# 2. Component Setup & Integrations:",
      ...selectedObjects.map(
        (c) => `# - Setup ${c.name} [Category: ${c.category}] (Requires: ${c.requires?.join(", ") || "none"})`
      ),
      "",
      "# 3. Run validation check",
      validationReport.valid
        ? "echo 'Custom stack initialized successfully with validated dependencies and no conflicts.'"
        : "echo 'Review the validation report before treating this stack as ready.'",
    ];

    const currentWarnings =
      validationReport?.warnings?.map((w) => w.message) || [];

    const customBp: Blueprint = {
      id: "custom-blueprint",
      title:
        projectDefinition.name.trim() || "Custom Synthesized Architecture Blueprint",
      description: projectDefinition.description.trim()
        ? projectDefinition.description.trim()
        : `Tailored architecture blueprint comprising ${selectedObjects.length} interconnected technology nodes.`,
      domain:
        projectDefinition.domain || (activeDomain !== "all" ? activeDomain : "multi-domain"),
      difficulty: customDifficulty,
      estimatedHours: totalHours || 12,
      components: selectedObjects,
      learningGoals:
        allLearningGoals.length > 0
          ? allLearningGoals
          : ["Architect custom domain integrations"],
      outputs:
        allOutputs.length > 0 ? allOutputs : ["architecture-diagram", "starter-code"],
      starterCommands: commands,
      warnings: currentWarnings,
      project:
        projectDefinition.name.trim() || projectDefinition.description.trim()
          ? projectDefinition
          : undefined,
      validation: toValidationSummary(validationReport),
    };

    setBlueprint(customBp);
  }, [selectedComponentIds, components, activeDomain, projectDefinition, validationReport]);

  // Load Curated Recipe
  const loadRecipe = useCallback(
    (recipeId: string) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;

      setActiveRecipeId(recipeId);
      if (recipe.domain) {
        setActiveDomain(recipe.domain);
      }

      // Auto-select recipe components
      const mergedIds = Array.from(
        new Set([...selectedComponentIds, ...(recipe.components || [])])
      );
      setSelectedComponentIds(mergedIds);

      const result = (architect as any).build({
        recipe: recipeId,
        selectedComponents: mergedIds,
      });

      if (result.blueprint) {
        setBlueprint({
          ...(result.blueprint as Blueprint),
          project:
            projectDefinition.name.trim() || projectDefinition.description.trim()
              ? projectDefinition
              : undefined,
          validation: toValidationSummary(result.report as ValidationReport),
        });
      }
    },
    [recipes, selectedComponentIds, architect, projectDefinition]
  );

  // Toggle Component Selection
  const toggleComponent = useCallback(
    (id: string) => {
      setSelectedComponentIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id];
        return next;
      });
    },
    []
  );

  // Select Multiple Components
  const selectComponents = useCallback((ids: string[]) => {
    setSelectedComponentIds(Array.from(new Set(ids)));
  }, []);

  // Remove Single Component
  const removeComponent = useCallback((id: string) => {
    setSelectedComponentIds((prev) => prev.filter((item) => item !== id));
  }, []);

  // Clear Selection
  const clearSelection = useCallback(() => {
    setSelectedComponentIds([]);
    setActiveRecipeId(null);
    setBlueprint(null);
  }, []);

  // Clear Blueprint
  const clearBlueprint = useCallback(() => {
    setActiveRecipeId(null);
    setBlueprint(null);
  }, []);

  // 1-Click Resolve Missing Dependencies
  const resolveMissingDependencies = useCallback(() => {
    setSelectedComponentIds((prev) => architect.resolveMissingDependencies(prev));
  }, [architect]);

  // Merged Report for Blueprint / Export Generation
  const mergedReport = useMemo((): MergedReport => {
    const report = validationReport || {
      score: 100,
      status: "Production Ready",
      warnings: [],
      suggestions: [],
    };
    const bp = (blueprint || {}) as Partial<Blueprint>;

    const domainObj = domains.find((d) => d.id === activeDomain);
    const domainTitle = domainObj ? domainObj.title : "Custom Tech Stack";

    const combinedWarnings = [...(report.warnings || [])];
    if (bp.warnings && Array.isArray(bp.warnings)) {
      bp.warnings.forEach((w) => {
        const msg = typeof w === "string" ? w : w;
        if (!combinedWarnings.some((cw) => cw.message === msg)) {
          combinedWarnings.push({
            component: "Blueprint",
            severity: "warning",
            message: typeof msg === "string" ? msg : JSON.stringify(msg),
          });
        }
      });
    }

    return {
      title:
        projectDefinition.name.trim() || bp.title || "Technology Stack Blueprint",
      score: report.score,
      status: report.status,
      domain: bp.domain || domainTitle,
      components: selectedComponents,
      warnings: combinedWarnings,
      suggestions: report.suggestions || [],
      starterCommands: bp.starterCommands || [],
      learningGoals: bp.learningGoals || [],
      outputs: bp.outputs || [],
      project:
        projectDefinition.name.trim() || projectDefinition.description.trim()
          ? projectDefinition
          : undefined,
      validation: toValidationSummary(report),
    };
  }, [validationReport, blueprint, domains, activeDomain, selectedComponents, projectDefinition]);

  // Export Blueprint as String
  const exportBlueprint = useCallback(
    (format: "json" | "markdown"): string => {
      try {
        return architect.export(format, mergedReport);
      } catch {
        if (format === "json") return JSON.stringify(mergedReport, null, 2);
        return `# ${mergedReport.title}\nScore: ${mergedReport.score}`;
      }
    },
    [architect, mergedReport]
  );

  // Download Blueprint File to Local Computer
  const downloadBlueprint = useCallback(
    (format: "json" | "markdown", customFilename?: string) => {
      const sanitizedTitle = (mergedReport.title || "tech-stack-blueprint")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const extension = format === "json" ? "json" : "md";
      const filename = customFilename || `${sanitizedTitle}.${extension}`;

      architect.download(format, filename, mergedReport);
    },
    [architect, mergedReport]
  );

  // Copy Blueprint to Clipboard
  const copyBlueprint = useCallback(
    async (format: "json" | "markdown"): Promise<boolean> => {
      try {
        const content = exportBlueprint(format);
        await navigator.clipboard.writeText(content);
        return true;
      } catch (err) {
        console.error("Clipboard copy failed:", err);
        return false;
      }
    },
    [exportBlueprint]
  );

  const applyLoadedProject = useCallback(
    ({ record, snapshot }: { record: { id: string; revision: number }; snapshot: ProjectSnapshotV1 }) => {
      setProjectDefinition(snapshot.projectDefinition);
      setSelectedComponentIds(snapshot.selectedComponentIds);
      setActiveRecipeId(snapshot.activeRecipeId);
      setActiveDomain(snapshot.projectDefinition.domain);
      setRequirementAnalysis(
        architect.analyzeRequirements(snapshot.projectDefinition)
      );
      setIgnoredRecommendationIds([]);
      setBlueprint(null);
      setCurrentProjectId(record.id);
      setCurrentProjectRevision(record.revision);
    },
    [architect]
  );

  const persistenceActions = useMemo(
    () =>
      createProviderPersistenceController({
        client: persistenceClient,
        registries: { domains, components, recipes },
        getCanonicalSnapshot,
        getCurrentProjectIdentity: () => ({
          id: currentProjectId,
          revision: currentProjectRevision,
        }),
        setPersistenceStatus,
        setPersistenceError,
        applyLoadedProject,
        applySavedIdentity: (record: { id: string; revision: number }) => {
          setCurrentProjectId(record.id);
          setCurrentProjectRevision(record.revision);
        },
        clearDeletedIdentity: (projectId: string) => {
          if (currentProjectId === projectId) {
            setCurrentProjectId(null);
            setCurrentProjectRevision(null);
          }
        },
      }),
    [
      persistenceClient,
      domains,
      components,
      recipes,
      getCanonicalSnapshot,
      currentProjectId,
      currentProjectRevision,
      applyLoadedProject,
    ]
  );

  const { saveProject, loadProject, listProjects, deleteProject } = persistenceActions;

  return (
    <TechStackContext.Provider
      value={{
        domains,
        components,
        recipes,
        categories,
        projectDefinition,
        analyzeProject,
        requirementAnalysis,
        ignoredRecommendationIds,
        addRecommendation,
        addAllCompatibleRecommendations,
        ignoreRecommendation,
        activeDomain,
        setActiveDomain,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        difficultyFilter,
        setDifficultyFilter,
        selectedComponentIds,
        selectedComponents,
        toggleComponent,
        selectComponents,
        removeComponent,
        clearSelection,
        resolveMissingDependencies,
        activeRecipeId,
        blueprint,
        loadRecipe,
        generateCustomBlueprint,
        clearBlueprint,
        validationReport,
        recipeRecommendations,
        mergedReport,
        filteredComponents,
        activeTab,
        setActiveTab,
        isInspectorOpen,
        setIsInspectorOpen,
        exportBlueprint,
        downloadBlueprint,
        copyBlueprint,
        currentProjectId,
        currentProjectRevision,
        persistenceStatus,
        persistenceError,
        saveProject,
        loadProject,
        listProjects,
        deleteProject,
      }}
    >
      {children}
    </TechStackContext.Provider>
  );
}

export function useTechStack() {
  const context = useContext(TechStackContext);
  if (!context) {
    throw new Error("useTechStack must be used within a TechStackProvider");
  }
  return context;
}
