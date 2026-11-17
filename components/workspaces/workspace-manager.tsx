"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LoaderCircle, Plus, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { WorkspaceInvitations } from "@/components/workspaces/workspace-invitations";
import { WorkspaceMembers } from "@/components/workspaces/workspace-members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Workspace = {
  id: string;
  name: string;
  isPersonal: boolean;
  role: "owner" | "admin" | "member" | "viewer";
  createdAt: string;
};

const roleLabel: Record<Workspace["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export function WorkspaceManager() {
  const router = useRouter();
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      setAuthenticated(Boolean(token));
      if (!token) {
        setWorkspaces([]);
        return;
      }

      const response = await fetch("/api/workspaces", {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error?.message || "Unable to load workspaces.");
      }
      setWorkspaces(payload.data.workspaces);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void loadWorkspaces(); });
  }, [loadWorkspaces]);

  const selectWorkspace = async (workspaceId: string) => {
    if (selectingId) return;
    setSelectingId(workspaceId);
    setError("");
    try {
      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      if (!token) {
        setAuthenticated(false);
        throw new Error("Sign in before selecting a workspace.");
      }
      const response = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error?.message || "Unable to select workspace.");
      }
      router.push("/app");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to select workspace.");
    } finally {
      setSelectingId(null);
    }
  };

  const createWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      if (!token) {
        setAuthenticated(false);
        throw new Error("Sign in before creating a workspace.");
      }

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error?.message || "Unable to create workspace.");
      }
      setName("");
      await loadWorkspaces();
      setNotice(`Workspace “${payload.data.name}” created. You are its owner.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit gap-1.5">
          <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
          Workspace management
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Your workspaces</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Workspaces keep projects and team access organised. Your role determines what you can manage.
        </p>
      </header>

      {!authenticated && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign in to manage workspaces</CardTitle>
            <CardDescription>Workspace membership is tied to your authenticated account. Use Sign in in the application header, then return here.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">{notice}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Workspaces you belong to</CardTitle>
            <CardDescription>Only workspaces where your account has a membership are shown.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => void loadWorkspaces()} disabled={loading} aria-label="Refresh workspaces">
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loading ? (
            <p className="py-4 text-sm text-muted-foreground">Loading workspaces…</p>
          ) : workspaces.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No workspace memberships found yet. Create a workspace to get started.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {workspaces.map((workspace) => (
                <li key={workspace.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-foreground">{workspace.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {new Date(workspace.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{roleLabel[workspace.role]}</Badge>
                  </div>
                  {workspace.isPersonal ? <p className="mt-3 text-xs text-muted-foreground">Personal workspace</p> : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => void selectWorkspace(workspace.id)}
                    disabled={!authenticated || selectingId !== null}
                  >
                    {selectingId === workspace.id ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
                    Open workspace
                  </Button>
                  <WorkspaceMembers workspaceId={workspace.id} workspaceRole={workspace.role} />
                  {workspace.role === "owner" || workspace.role === "admin" ? (
                    <WorkspaceInvitations workspaceId={workspace.id} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a workspace</CardTitle>
          <CardDescription>You will become the workspace owner. You can manage membership and projects from the workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createWorkspace} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={80}
                placeholder="e.g. Product engineering"
                required
                disabled={!authenticated || creating}
              />
            </div>
            <Button type="submit" disabled={!authenticated || creating || name.trim().length < 2 || name.trim().length > 80} className="h-10">
              {creating ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 size-4" aria-hidden="true" />}
              Create workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
