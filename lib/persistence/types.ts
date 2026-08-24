import type { Component, DifficultyLevel } from "@/lib/types/component";
import type { Domain } from "@/lib/types/domain";
import type { Recipe } from "@/lib/types/recipe";
import type { ProjectDefinition } from "@/lib/types/project";

export const PROJECT_SNAPSHOT_VERSION = 1 as const;
export type ProjectSnapshotVersion = typeof PROJECT_SNAPSHOT_VERSION;

/**
 * The only editable product state that Phase 3A.1 permits to be persisted.
 * Analysis, validation, recipes, blueprints, exports, and UI state are
 * intentionally absent.
 */
export interface ProjectSnapshotV1 {
  schemaVersion: ProjectSnapshotVersion;
  projectDefinition: ProjectDefinition;
  selectedComponentIds: string[];
  activeRecipeId: string | null;
}

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
  snapshot: ProjectSnapshotV1;
}

/**
 * Write DTO containing canonical state only. It deliberately has no ID,
 * timestamps, revision, ownership, or other server-controlled metadata.
 */
export type ProjectPersistenceDTO = Omit<ProjectSnapshotV1, "schemaVersion">;

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
  | "PERSISTENCE_UNAVAILABLE"
  | "PERSISTENCE_CONFLICT"
  | "PERSISTENCE_NOT_FOUND";

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
  schema_version: number;
  revision: number;
  created_at: string;
  updated_at: string;
}
