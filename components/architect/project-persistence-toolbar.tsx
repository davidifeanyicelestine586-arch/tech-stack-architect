"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { SavedProjectSummary } from "@/context/tech-stack-context";
import {
  canReloadSavedVersion,
  getDeleteConfirmationName,
  getPersistenceErrorTitle,
  getPersistenceStatusLabel,
  getProjectListState,
  getSaveButtonState,
  shouldWarnBeforeNewProject,
} from "@/lib/persistence/client/project-persistence-ui-state.js";

const formatUpdatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated recently";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function ProjectPersistenceToolbar() {
  const {
    projectDefinition,
    persistenceDirty,
    currentProjectId,
    persistenceStatus,
    persistenceError,
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    resetProject,
  } = useTechStack();
  const [openDialog, setOpenDialog] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [projects, setProjects] = useState<SavedProjectSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedProjectSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDirty = persistenceDirty;
  const isBusy = persistenceStatus === "saving" || persistenceStatus === "loading";
  const statusLabel = getPersistenceStatusLabel({ dirty: isDirty, status: persistenceStatus });
  const saveButtonState = getSaveButtonState({ dirty: isDirty, status: persistenceStatus });
  const listState = getProjectListState({
    projects,
    status: persistenceStatus,
    error: listError || persistenceError,
  });
  const conflict = canReloadSavedVersion({
    error: persistenceError,
    currentProjectId,
  });

  const refreshProjects = async () => {
    setListError(null);
    try {
      setProjects(await listProjects());
    } catch {
      setListError("Couldn’t load your saved projects. Try again.");
    }
  };

  const handleOpenDialogChange = (nextOpen: boolean) => {
    setOpenDialog(nextOpen);
    if (nextOpen) void refreshProjects();
  };

  const handleSave = async () => {
    try {
      await saveProject();
      if (openDialog) await refreshProjects();
    } catch {
      // The provider exposes the stable user-facing error state.
    }
  };

  const handleReloadSavedVersion = async () => {
    if (!currentProjectId) return;
    try {
      await loadProject(currentProjectId);
      if (openDialog) await refreshProjects();
    } catch {
      // The provider keeps the local project intact and exposes the failure.
    }
  };

  const handleOpenProject = async (project: SavedProjectSummary) => {
    try {
      await loadProject(project.id);
      setOpenDialog(false);
    } catch {
      // Keep the dialog open so the user can retry or inspect the error.
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects((current) =>
        current?.filter((project) => project.id !== deleteTarget.id) ?? null
      );
      setDeleteTarget(null);
    } catch {
      // The provider exposes the stable user-facing error state.
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewProject = () => {
    if (shouldWarnBeforeNewProject(isDirty)) {
      setNewDialogOpen(true);
      return;
    }
    resetProject();
  };

  const confirmNewProject = () => {
    resetProject();
    setNewDialogOpen(false);
    setOpenDialog(false);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
      <div className="hidden max-w-44 items-center gap-1.5 truncate lg:flex" title={projectDefinition.name || "New project"}>
        <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <span className="truncate text-[11px] font-semibold text-foreground">
          {projectDefinition.name.trim() || "New project"}
        </span>
      </div>
      <Badge
        variant={isDirty || persistenceError ? "outline" : "secondary"}
        className="gap-1 whitespace-nowrap px-2 py-1 text-[10px] font-semibold"
        aria-live="polite"
      >
        {persistenceStatus === "saving" || persistenceStatus === "loading" ? (
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        ) : persistenceError ? (
          <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        )}
        <span>{statusLabel}</span>
      </Badge>
      <Separator orientation="vertical" className="mx-0.5 hidden h-5 sm:block" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs"
        onClick={handleNewProject}
        disabled={isBusy}
        aria-label="Create new project"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        <span>New</span>
      </Button>
      <Dialog open={openDialog} onOpenChange={handleOpenDialogChange}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              disabled={isBusy}
              aria-label="Open saved project"
            />
          }
        >
          <FolderOpen className="size-3.5" aria-hidden="true" />
          <span>Open</span>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Open project</DialogTitle>
            <DialogDescription>
              Choose a saved project to restore its project definition and selected architecture.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(60vh,28rem)] overflow-y-auto pr-1" aria-live="polite">
            {listState === "loading" ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Loading saved projects…
              </div>
            ) : listState === "error" ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>
                  {listError || persistenceError?.message}
                </AlertDescription>
              </Alert>
            ) : listState === "ready" ? (
              <div className="grid gap-2">
                {projects?.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => void handleOpenProject(project)}
                      disabled={isBusy}
                      aria-label={`Open ${project.name || "Untitled project"}`}
                    >
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {project.name || "Untitled project"}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {project.description || project.domain || "No description"}
                      </span>
                      <span className="mt-2 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {formatUpdatedAt(project.updatedAt)}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(project)}
                      disabled={isBusy || isDeleting}
                      aria-label={`Delete ${project.name || "Untitled project"}`}
                      title="Delete project"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <FolderOpen className="mx-auto size-7 text-muted-foreground/70" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-foreground">No saved projects yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Analyze a project, then use Save to create your first saved workspace.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => void refreshProjects()} disabled={isBusy} className="gap-1.5">
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Refresh list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button
        variant="default"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs shadow-xs"
        onClick={() => void handleSave()}
        disabled={saveButtonState.disabled}
        aria-label="Save current project"
      >
        {persistenceStatus === "saving" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-3.5" aria-hidden="true" />
        )}
        <span>{saveButtonState.label}</span>
      </Button>
      {persistenceError && (
        <div className="basis-full pt-1 sm:basis-auto sm:pt-0" role="alert">
          <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10px] text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <span className="max-w-52 truncate" title={`${getPersistenceErrorTitle(persistenceError.code)}: ${persistenceError.message}`}>
              <span className="font-semibold">{getPersistenceErrorTitle(persistenceError.code)}:</span>{" "}
              {persistenceError.message}
            </span>
            {conflict && currentProjectId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 shrink-0 gap-1 px-1.5 text-[10px]"
                onClick={() => void handleReloadSavedVersion()}
                disabled={isBusy}
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                Reload saved version
              </Button>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new project?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current project has unsaved changes. Starting over will clear this in-memory work but will not delete its saved version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNewProject}>Start new project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{getDeleteConfirmationName(deleteTarget)}” from your saved projects. Your current in-memory work will remain available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              {isDeleting ? "Deleting…" : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
