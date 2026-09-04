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
  domains: Domain[];
  components: Component[];
  recipes: Recipe[];
  categories: string[];
  activeDomain: string;
  setActiveDomain: (domainId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  difficultyFilter: string;
  setDifficultyFilter: (difficulty: string) => void;
  projectDefinition: ProjectDefinition;
  updateProjectDefinition: <Key extends keyof ProjectDefinition>(key: Key, value: ProjectDefinition[Key]) => void;
  persistenceDirty: boolean;
  analyzeProject: (project: ProjectDefinition) => RequirementAnalysis;
  requirementAnalysis: RequirementAnalysis | null;
  ignoredRecommendationIds: string[];
  addRecommendation: (componentId: string) => void;
  addAllCompatibleRecommendations: () => void;
  ignoreRecommendation: (componentId: string) => void;
  selectedComponentIds: string[];
  selectedComponents: Component[];
  toggleComponent: (id: string) => void;
  selectComponents: (ids: string[]) => void;
  removeComponent: (id: string) => void;
  clearSelection: () => void;
  resolveMissingDependencies: () => void;
  activeRecipeId: string | null;
  blueprint: Blueprint | null;
  loadRecipe: (recipeId: string) => void;
  generateCustomBlueprint: () => void;
  clearBlueprint: () => void;
  validationReport: ValidationReport;
  recipeRecommendations: RecipeMatch[];
  mergedReport: MergedReport;
  filteredComponents: Component[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
  exportBlueprint: (format: "json" | "markdown") => string;
  downloadBlueprint: (format: "json" | "markdown", filename?: string) => void;
  copyBlueprint: (format: "json" | "markdown") => Promise<boolean>;
  currentProjectId: string | null;
  currentProjectRevision: number | null;
  persistenceStatus: PersistenceStatus;
  persistenceError: ProviderPersistenceErrorInfo | null;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  listProjects: () => Promise<SavedProjectSummary[]>;
  deleteProject: (projectId: string) => Promise<void>;
  resetProject: () => void;
}

const TechStackContext = createContext<TechStackContextType | null>(null);

const canonicalSnapshotSignature = (snapshot: ProjectSnapshotV1) =>
  JSON.stringify({ ...snapshot, selectedComponentIds: [...snapshot.selectedComponentIds].sort() });

const toValidationSummary = (report: ValidationReport) => ({
  valid: report.valid,
  score: report.score,
  status: report.status,
  missingDependencies: report.dependencyReport.missing,
  conflicts: [
    ...report.conflictReport.componentConflicts.map((conflict) => `${conflict.source} conflicts with ${conflict.target}: ${conflict.reason}`),
    ...report.conflictReport.pinConflicts.map((conflict) => `Pin ${conflict.pin} is shared by ${conflict.components.join(", ")}.`),
    ...report.conflictReport.ruleViolations.map((violation) => violation.message),
  ],
});

export function TechStackProvider({ children }: { children: ReactNode }) {
  const domains = useMemo(() => domainsData as Domain[], []);
  const components = useMemo(() => componentsData as Component[], []);
  const recipes = useMemo(() => recipesData as Recipe[], []);
  const architect = useMemo(() => new TechStackArchitect({ domains, components, recipes }), [domains, components, recipes]);
  const persistenceClient = useMemo(() => createProjectPersistenceClient(), []);
  const [activeDomain, setActiveDomain] = useState<string>("all");
  const [projectDefinition, setProjectDefinition] = useState<ProjectDefinition>({ name: "", description: "", domain: domains[0]?.id || "web-saas", difficulty: "Intermediate", requirements: "" });
  const [lastPersistedSnapshotSignature, setLastPersistedSnapshotSignature] = useState<string | null>(null);
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

  const getCanonicalSnapshot = useCallback((): ProjectSnapshotV1 => ({ schemaVersion: 1, projectDefinition, selectedComponentIds, activeRecipeId }), [projectDefinition, selectedComponentIds, activeRecipeId]);
  const canonicalSnapshot = getCanonicalSnapshot();
  const updateProjectDefinition = useCallback(<Key extends keyof ProjectDefinition>(key: Key, value: ProjectDefinition[Key]) => {
    setProjectDefinition((previous) => ({ ...previous, [key]: value }));
    if (key === "domain" && typeof value === "string") {
      setActiveDomain(value);
    }
    setPersistenceError(null);
    setPersistenceStatus((status) => (status === "error" ? "idle" : status));
  }, []);

  const hasCanonicalProjectContent = Boolean(canonicalSnapshot.projectDefinition.name.trim() || canonicalSnapshot.projectDefinition.description.trim() || canonicalSnapshot.projectDefinition.requirements.trim() || canonicalSnapshot.selectedComponentIds.length || canonicalSnapshot.activeRecipeId);
  const persistenceDirty = lastPersistedSnapshotSignature ? canonicalSnapshotSignature(canonicalSnapshot) !== lastPersistedSnapshotSignature : hasCanonicalProjectContent;

  const categories = useMemo(() => {
    const set = new Set<string>();
    components.forEach((c) => { if (c.category) set.add(c.category); });
    return Array.from(set).sort();
  }, [components]);
  const selectedComponents = useMemo(() => {
    const idSet = new Set(selectedComponentIds);
    return components.filter((c) => idSet.has(c.id));
  }, [components, selectedComponentIds]);
  const validationReport = useMemo(() => architect.validate(selectedComponentIds) as ValidationReport, [architect, selectedComponentIds]);
  const recipeRecommendations = useMemo(() => architect.recommendRecipes(selectedComponentIds) as RecipeMatch[], [architect, selectedComponentIds]);

  const analyzeProject = useCallback((project: ProjectDefinition): RequirementAnalysis => {
    const normalizedProject = { ...project, name: project.name.trim(), description: project.description.trim(), requirements: project.requirements.trim() };
    const analysis = architect.analyzeRequirements(normalizedProject);
    setProjectDefinition(normalizedProject);
    setActiveDomain(normalizedProject.domain);
    setRequirementAnalysis(analysis);
    setIgnoredRecommendationIds([]);
    setActiveRecipeId(null);
    setBlueprint(null);
    return analysis;
  }, [architect]);

  const addRecommendation = useCallback((componentId: string) => {
    setSelectedComponentIds((previous) => previous.includes(componentId) ? previous : [...previous, componentId]);
    setIgnoredRecommendationIds((previous) => previous.filter((id) => id !== componentId));
  }, []);
  const addAllCompatibleRecommendations = useCallback(() => {
    if (!requirementAnalysis) return;
    const additions = requirementAnalysis.recommendations.filter((recommendation) => recommendation.compatible && !ignoredRecommendationIds.includes(recommendation.component.id)).map((recommendation) => recommendation.component.id);
    setSelectedComponentIds((previous) => Array.from(new Set([...previous, ...additions])));
  }, [ignoredRecommendationIds, requirementAnalysis]);
  const ignoreRecommendation = useCallback((componentId: string) => setIgnoredRecommendationIds((previous) => previous.includes(componentId) ? previous : [...previous, componentId]), []);

  const filteredComponents = useMemo(() => components.filter((comp) => {
    if (activeDomain !== "all" && comp.domain !== activeDomain) return false;
    if (selectedCategory !== "all" && comp.category !== selectedCategory) return false;
    if (difficultyFilter !== "all" && comp.difficulty !== difficultyFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!comp.name.toLowerCase().includes(query) && !comp.description.toLowerCase().includes(query) && !comp.category.toLowerCase().includes(query) && !comp.tags?.some((t) => t.toLowerCase().includes(query))) return false;
    }
    return true;
  }), [components, activeDomain, selectedCategory, difficultyFilter, searchQuery]);

  const generateCustomBlueprint = useCallback(() => {
    const selectedObjects = selectedComponentIds.map((id) => components.find((c) => c.id === id)).filter(Boolean) as Component[];
    if (selectedObjects.length === 0) { setBlueprint(null); return; }
    const totalHours = selectedObjects.reduce((sum, c) => sum + (c.estimatedLearningHours || 0), 0);
    const maxComplexity = selectedObjects.reduce((max, c) => Math.max(max, c.complexity || 1), 1);
    const customDifficulty: "Beginner" | "Intermediate" | "Advanced" = maxComplexity >= 4 ? "Advanced" : maxComplexity >= 3 ? "Intermediate" : "Beginner";
    const allOutputs = Array.from(new Set(selectedObjects.flatMap((c) => c.outputs || [])));
    const allLearningGoals = selectedObjects.map((c) => `Master integration, security, and lifecycle of ${c.name} (${c.category})`);
    const commands = [
      "# ========================================================", "# Ediccrew Tech Stack Architect - Initializer Script",
      `# Stack: Custom ${activeDomain !== "all" ? activeDomain.toUpperCase() : "MULTI-DOMAIN"} Architecture`,
      "# ========================================================", "mkdir ediccrew-custom-stack", "cd ediccrew-custom-stack", "",
      "# 1. Initialize environment", "git init", "npm init -y", "", "# 2. Component Setup & Integrations:",
      ...selectedObjects.map((c) => `# - Setup ${c.name} [Category: ${c.category}] (Requires: ${c.requires?.join(", ") || "none"})`), "",
      "# 3. Run validation check",
      validationReport.valid ? "echo 'Custom stack initialized successfully with validated dependencies and no conflicts.'" : "echo 'Review the validation report before treating this stack as ready.'",
    ];
    const currentWarnings = validationReport?.warnings?.map((w) => w.message) || [];
    setBlueprint({
      id: "custom-blueprint", title: projectDefinition.name.trim() || "Custom Synthesized Architecture Blueprint",
      description: projectDefinition.description.trim() ? projectDefinition.description.trim() : `Tailored architecture blueprint comprising ${selectedObjects.length} interconnected technology nodes.`,
      domain: projectDefinition.domain || (activeDomain !== "all" ? activeDomain : "multi-domain"), difficulty: customDifficulty,
      estimatedHours: totalHours || 12, components: selectedObjects, learningGoals: allLearningGoals.length > 0 ? allLearningGoals : ["Architect custom domain integrations"],
      outputs: allOutputs.length > 0 ? allOutputs : ["architecture-diagram", "starter-code"], starterCommands: commands, warnings: currentWarnings,
      project: projectDefinition.name.trim() || projectDefinition.description.trim() ? projectDefinition : undefined, validation: toValidationSummary(validationReport),
    });
  }, [selectedComponentIds, components, activeDomain, projectDefinition, validationReport]);

  const loadRecipe = useCallback((recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId); if (!recipe) return;
    setActiveRecipeId(recipeId); if (recipe.domain) setActiveDomain(recipe.domain);
    const mergedIds = Array.from(new Set([...selectedComponentIds, ...(recipe.components || [])])); setSelectedComponentIds(mergedIds);
    const result = (architect as any).build({ recipe: recipeId, selectedComponents: mergedIds });
    if (result.blueprint) setBlueprint({ ...(result.blueprint as Blueprint), project: projectDefinition.name.trim() || projectDefinition.description.trim() ? projectDefinition : undefined, validation: toValidationSummary(result.report as ValidationReport) });
  }, [recipes, selectedComponentIds, architect, projectDefinition]);
  const toggleComponent = useCallback((id: string) => setSelectedComponentIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]), []);
  const selectComponents = useCallback((ids: string[]) => setSelectedComponentIds(Array.from(new Set(ids))), []);
  const removeComponent = useCallback((id: string) => setSelectedComponentIds((prev) => prev.filter((item) => item !== id)), []);
  const clearSelection = useCallback(() => { setSelectedComponentIds([]); setActiveRecipeId(null); setBlueprint(null); }, []);
  const clearBlueprint = useCallback(() => { setActiveRecipeId(null); setBlueprint(null); }, []);
  const resolveMissingDependencies = useCallback(() => setSelectedComponentIds((prev) => architect.resolveMissingDependencies(prev)), [architect]);
  const mergedReport = useMemo((): MergedReport => {
    const report = validationReport || { score: 100, status: "Production Ready", warnings: [], suggestions: [] };
    const bp = (blueprint || {}) as Partial<Blueprint>;
    const domainObj = domains.find((d) => d.id === activeDomain); const domainTitle = domainObj ? domainObj.title : "Custom Tech Stack";
    const combinedWarnings = [...(report.warnings || [])];
    if (bp.warnings && Array.isArray(bp.warnings)) bp.warnings.forEach((w) => { const msg = typeof w === "string" ? w : w; if (!combinedWarnings.some((cw) => cw.message === msg)) combinedWarnings.push({ component: "Blueprint", severity: "warning", message: typeof msg === "string" ? msg : JSON.stringify(msg) }); });
    return { title: projectDefinition.name.trim() || bp.title || "Technology Stack Blueprint", score: report.score, status: report.status, domain: bp.domain || domainTitle, components: selectedComponents, warnings: combinedWarnings, suggestions: report.suggestions || [], starterCommands: bp.starterCommands || [], learningGoals: bp.learningGoals || [], outputs: bp.outputs || [], project: projectDefinition.name.trim() || projectDefinition.description.trim() ? projectDefinition : undefined, validation: toValidationSummary(report) };
  }, [validationReport, blueprint, domains, activeDomain, selectedComponents, projectDefinition]);
  const exportBlueprint = useCallback((format: "json" | "markdown"): string => { try { return architect.export(format, mergedReport); } catch { return format === "json" ? JSON.stringify(mergedReport, null, 2) : `# ${mergedReport.title}\nScore: ${mergedReport.score}`; } }, [architect, mergedReport]);
  const downloadBlueprint = useCallback((format: "json" | "markdown", customFilename?: string) => { const sanitizedTitle = (mergedReport.title || "tech-stack-blueprint").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); architect.download(format, customFilename || `${sanitizedTitle}.${format === "json" ? "json" : "md"}`, mergedReport); }, [architect, mergedReport]);
  const copyBlueprint = useCallback(async (format: "json" | "markdown"): Promise<boolean> => { try { await navigator.clipboard.writeText(exportBlueprint(format)); return true; } catch (err) { console.error("Clipboard copy failed:", err); return false; } }, [exportBlueprint]);
  const resetProject = useCallback(() => { const nextProjectDefinition: ProjectDefinition = { name: "", description: "", domain: domains[0]?.id || "web-saas", difficulty: "Intermediate", requirements: "" }; setProjectDefinition(nextProjectDefinition); setLastPersistedSnapshotSignature(null); setActiveDomain(nextProjectDefinition.domain); setRequirementAnalysis(null); setIgnoredRecommendationIds([]); setSelectedComponentIds([]); setActiveRecipeId(null); setBlueprint(null); setSearchQuery(""); setSelectedCategory("all"); setDifficultyFilter("all"); setCurrentProjectId(null); setCurrentProjectRevision(null); setPersistenceStatus("idle"); setPersistenceError(null); }, [domains]);
  const applyLoadedProject = useCallback(({ record, snapshot }: { record: { id: string; revision: number }; snapshot: ProjectSnapshotV1 }) => { setProjectDefinition(snapshot.projectDefinition); setLastPersistedSnapshotSignature(canonicalSnapshotSignature(snapshot)); setSelectedComponentIds(snapshot.selectedComponentIds); setActiveRecipeId(snapshot.activeRecipeId); setActiveDomain(snapshot.projectDefinition.domain); setRequirementAnalysis(architect.analyzeRequirements(snapshot.projectDefinition)); setIgnoredRecommendationIds([]); setBlueprint(null); setCurrentProjectId(record.id); setCurrentProjectRevision(record.revision); }, [architect]);
  const persistenceActions = useMemo(() => createProviderPersistenceController({ client: persistenceClient, registries: { domains, components, recipes }, getCanonicalSnapshot, getCurrentProjectIdentity: () => ({ id: currentProjectId, revision: currentProjectRevision }), setPersistenceStatus, setPersistenceError, applyLoadedProject, applySavedIdentity: (record: { id: string; revision: number }) => { setCurrentProjectId(record.id); setCurrentProjectRevision(record.revision); }, markPersistenceSaved: (snapshot: ProjectSnapshotV1) => { setLastPersistedSnapshotSignature(canonicalSnapshotSignature(snapshot)); }, clearDeletedIdentity: (projectId: string) => { if (currentProjectId === projectId) { setCurrentProjectId(null); setCurrentProjectRevision(null); setLastPersistedSnapshotSignature(null); } } }), [persistenceClient, domains, components, recipes, getCanonicalSnapshot, currentProjectId, currentProjectRevision, applyLoadedProject]);
  const { saveProject, loadProject, listProjects, deleteProject } = persistenceActions;
  return <TechStackContext.Provider value={{ domains, components, recipes, categories, projectDefinition, updateProjectDefinition, persistenceDirty, analyzeProject, requirementAnalysis, ignoredRecommendationIds, addRecommendation, addAllCompatibleRecommendations, ignoreRecommendation, activeDomain, setActiveDomain, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, difficultyFilter, setDifficultyFilter, selectedComponentIds, selectedComponents, toggleComponent, selectComponents, removeComponent, clearSelection, resolveMissingDependencies, activeRecipeId, blueprint, loadRecipe, generateCustomBlueprint, clearBlueprint, validationReport, recipeRecommendations, mergedReport, filteredComponents, activeTab, setActiveTab, isInspectorOpen, setIsInspectorOpen, exportBlueprint, downloadBlueprint, copyBlueprint, currentProjectId, currentProjectRevision, persistenceStatus, persistenceError, saveProject, loadProject, listProjects, deleteProject, resetProject }}>{children}</TechStackContext.Provider>;
}

export function useTechStack() { const context = useContext(TechStackContext); if (!context) throw new Error("useTechStack must be used within a TechStackProvider"); return context; }
