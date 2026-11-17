"use client";

import { useState } from "react";
import { LoaderCircle, LockKeyhole, RefreshCw, UserPlus, UserRoundMinus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ProjectRole = "project_admin" | "editor" | "viewer";
type ProjectMember = {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: ProjectRole;
  assignedAt: string;
};
type AvailableMember = {
  userId: string;
  email: string | null;
  displayName: string | null;
  workspaceRole: "owner" | "admin" | "member" | "viewer";
  assigned: boolean;
};

const roleLabel: Record<ProjectRole, string> = {
  project_admin: "Project Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function ProjectAccessManager({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("editor");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = async () => {
    const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
    if (sessionError) throw sessionError;
    if (!data.session?.access_token) throw new Error("Sign in to manage project access.");
    return data.session.access_token;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to load project access.");
      setMembers(payload.data.members);
      setAvailableMembers(payload.data.availableMembers);
      if (!selectedUserId) {
        const firstAvailable = payload.data.availableMembers.find((member: AvailableMember) => !member.assigned);
        if (firstAvailable) setSelectedUserId(firstAvailable.userId);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load project access.");
    } finally {
      setLoading(false);
    }
  };

  const grant = async (memberId = selectedUserId, role = selectedRole) => {
    if (!memberId || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: memberId, role }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to update project access.");
      setNotice("Project access updated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update project access.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: ProjectMember) => {
    if (!window.confirm(`Remove project access for ${member.email || "this member"}?`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch(`/api/projects/${projectId}/members/${member.userId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to remove project access.");
      setNotice("Project access removed.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove project access.");
    } finally {
      setSaving(false);
    }
  };

  const openDialog = (next: boolean) => {
    setOpen(next);
    if (next) void load();
    else {
      setError("");
      setNotice("");
    }
  };

  const selectedMember = availableMembers.find((member) => member.userId === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={openDialog}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="h-10 gap-2">
            <LockKeyhole className="size-4" aria-hidden="true" />
            Manage project access
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project access</DialogTitle>
          <DialogDescription>
            Grant access only to people who already belong to this workspace. Project roles never grant workspace-level permissions.
          </DialogDescription>
        </DialogHeader>

        {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        {notice ? <p role="status" className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">{notice}</p> : null}

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">People with project access</h3>
            <Button type="button" size="icon" variant="ghost" aria-label="Refresh project access" onClick={() => void load()} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          {loading ? <p className="text-sm text-muted-foreground">Loading project access…</p> : members.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No explicit project memberships found.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {members.map((member) => (
                <li key={member.userId} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{member.displayName || member.email || "Workspace member"}</p>
                    {member.displayName && member.email ? <p className="truncate text-xs text-muted-foreground">{member.email}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{roleLabel[member.role]}</Badge>
                    <select
                      aria-label={`Project role for ${member.email || member.userId}`}
                      value={member.role}
                      onChange={(event) => void grant(member.userId, event.target.value as ProjectRole)}
                      disabled={saving || loading}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="project_admin">Project Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove project access for ${member.email || "member"}`} onClick={() => void remove(member)} disabled={saving || loading}>
                      {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <UserRoundMinus className="size-4" aria-hidden="true" />}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Add a workspace member</h3>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <select
              aria-label="Choose workspace member"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={loading || saving || availableMembers.length === 0}
              className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a workspace member</option>
              {availableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.email || member.displayName || member.userId}{member.assigned ? " (already assigned)" : ""}
                </option>
              ))}
            </select>
            <select
              aria-label="Choose project role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as ProjectRole)}
              disabled={saving || selectedMember?.workspaceRole === "viewer"}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="project_admin">Project Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {selectedMember?.workspaceRole === "viewer" ? <p className="text-xs text-muted-foreground">Workspace viewers can only receive Viewer access on a project.</p> : null}
          <Button type="button" onClick={() => void grant()} disabled={!selectedUserId || saving || loading}>
            {saving ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <UserPlus className="mr-2 size-4" aria-hidden="true" />}
            Add or update project access
          </Button>
        </section>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
