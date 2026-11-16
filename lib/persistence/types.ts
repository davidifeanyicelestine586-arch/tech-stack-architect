import type { Component, DifficultyLevel } from "@/lib/types/component";
import type { Domain } from "@/lib/types/domain";
import type { Recipe } from "@/lib/types/recipe";
import type { ProjectDefinition } from "@/lib/types/project";
import type { ArchitectureSpecification } from "@/lib/types/architecture";
import type { DevelopmentPlan } from "@/lib/types/development-plan";

export const PROJECT_SNAPSHOT_VERSION = 2 as const;
export type ProjectSnapshotVersion = typeof PROJECT_SNAPSHOT_VERSION;

/** Legacy persisted shape accepted only for migration and compatibility. */
export interface ProjectSnapshotV1 {
  schemaVersion: 1;
  projectDefinition: ProjectDefinition;
  selectedComponentIds: string[];
  activeRecipeId: string | null;
}

/**
 * Canonical editable project state. Derived recommendations, validation,
 * generated previews, exports, and transient UI state remain excluded.
 */
export interface ProjectSnapshotV2 {
  schemaVersion: ProjectSnapshotVersion;
  projectDefinition: ProjectDefinition;
  selectedComponentIds: string[];
  activeRecipeId: string | null;
  architecture: ArchitectureSpecification | null;
  developmentPlan: DevelopmentPlan | null;
}

export type ProjectSnapshot = ProjectSnapshotV1 | ProjectSnapshotV2;

/**
 * Server-owned metadata returned with a saved record. These fields are never
 * accepted as mutable project state from a client write payload.
 */
export interface SavedRecordMetadata {
  id: string;
  schemaVersion: ProjectSnapshotVersion;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord extends SavedRecordMetadata {
  snapshot: ProjectSnapshotV2;
}

/** Write DTO containing canonical state only. */
export type ProjectPersistenceDTO = Omit<ProjectSnapshotV2, "schemaVersion">;

/** Database-shaped payload emitted by serialization. */
export interface SerializedProjectSnapshot {
  schema_version: ProjectSnapshotVersion;
  name: string;
  description: string;
  domain_id: string;
  difficulty: DifficultyLevel;
  requirements: string;
  selected_component_ids: string[];
  active_recipe_id: string | null;
  architecture: ArchitectureSpecification | null;
  development_plan: DevelopmentPlan | null;
}

/** Minimal registry shape required to validate persisted references. */
export interface PersistenceRegistries {
  domains: readonly Pick<Domain, "id">[];
  components: readonly Pick<Component, "id">[];
  recipes: readonly Pick<Recipe, "id">[];
}

export type PersistenceScope =
  | { kind: "anonymous"; sessionId: string }
  | { kind: "user"; userId: string };

export type PersistenceErrorCode =
  | "INVALID_SNAPSHOT"
  | "INVALID_RECORD"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "UNKNOWN_REFERENCE"
  | "VALIDATION_FAILURE"
  | "UNAUTHORIZED"
  | "DATABASE_FAILURE"
  | "MALFORMED_RECORD"
  | "PERSISTENCE_UNAVAILABLE"
  | "PERSISTENCE_CONFLICT"
  | "PERSISTENCE_NOT_FOUND"
  | "CONFIGURATION";

export interface PersistenceErrorDetails {
  field?: string;
  errors?: string[];
}

export interface PersistenceError {
  name: "PersistenceError";
  code: PersistenceErrorCode;
  message: string;
  details?: PersistenceErrorDetails;
}

export interface ProjectPersistenceRecord {
  id: string;
  name: string;
  description: string;
  domain_id: string;
  difficulty: string;
  requirements: string;
  selected_component_ids: string[];
  active_recipe_id: string | null;
  architecture: ArchitectureSpecification | null;
  development_plan: DevelopmentPlan | null;
  schema_version: number;
  revision: number;
  created_at: string;
  updated_at: string;
  owner_id?: string | null;
  anonymous_session_id?: string | null;
}

export interface ProjectRepositoryRow extends ProjectPersistenceRecord {
  owner_id: string | null;
  anonymous_session_id: string | null;
}

export interface ProjectRepositoryClient {
  insertProject(row: Omit<ProjectRepositoryRow, "id" | "revision" | "created_at" | "updated_at">): Promise<ProjectRepositoryRow>;
  listProjects(filters: Record<string, string>): Promise<ProjectRepositoryRow[]>;
  getProject(filters: Record<string, string>): Promise<ProjectRepositoryRow | null>;
  updateProject(filters: Record<string, string>, patch: Partial<ProjectRepositoryRow>): Promise<ProjectRepositoryRow | null>;
  deleteProject(filters: Record<string, string>): Promise<boolean>;
}
