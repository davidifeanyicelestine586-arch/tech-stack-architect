"use client";

import { useState } from "react";
import { Archive, LoaderCircle, Save, Settings2, ShieldCheck, Undo2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "owner" | "admin" | "member" | "viewer";
type MemberOption = { userId: string; email: string | null; displayName: string | null; role: Role };

export function WorkspaceSettings({
  workspace,
  onChanged,
}: {
  workspace: {
    id: string;
    name: string;
    createdBy: string | null;
    isPersonal: boolean;
    role: Role;
    status: "active" | "archived";
    visibility: "private" | "discoverable";
  };
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [visibility, setVisibility] = useState(workspace.visibility);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const accessToken = async () => {
    const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
    if (sessionError) throw sessionError;
    if (!data.session?.access_token) throw new Error("Sign in to manage workspace settings.");
    return data.session.access_token;
  };

  const request = async (path: string, method: string, body?: Record<string, unknown>) => {
    const token = await accessToken();
    const response = await fetch(path, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json();
    if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Workspace operation failed.");
    return payload.data;
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch(`/api/workspaces/${workspace.id}/members`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to load workspace members.");
      const options = payload.data.members.filter((member: MemberOption) => member.userId !== workspace.createdBy && member.role !== "owner");
      setMembers(options);
      if (!newOwnerId && options[0]) setNewOwnerId(options[0].userId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load workspace members.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body: Record<string, unknown> = {};
      if (name.trim() !== workspace.name) body.name = name.trim();
      if (visibility !== workspace.visibility) body.visibility = visibility;
      if (!Object.keys(body).length) {
        setNotice("There are no workspace settings changes to save.");
        return;
      }
      await request(`/api/workspaces/${workspace.id}`, "PATCH", body);
      setNotice("Workspace settings saved.");
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save workspace settings.");
    } finally {
      setSaving(false);
    }
  };

  const transferOwnership = async () => {
    const selected = members.find((member) => member.userId === newOwnerId);
    if (!selected || !window.confirm(`Transfer ownership of “${workspace.name}” to ${selected.email || selected.displayName || "this member"}? You will become an admin.`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await request(`/api/workspaces/${workspace.id}/transfer`, "POST", { newOwnerId });
      setNotice("Workspace ownership transferred. Your role is now Admin.");
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to transfer workspace ownership.");
    } finally {
      setSaving(false);
    }
  };

  const archiveWorkspace = async () => {
    if (!window.confirm(`Archive “${workspace.name}”? Workspace project access will be suspended until the owner restores it.`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await request(`/api/workspaces/${workspace.id}/archive`, "POST");
      setNotice("Workspace archived.");
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to archive workspace.");
    } finally {
      setSaving(false);
    }
  };

  const restoreWorkspace = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await request(`/api/workspaces/${workspace.id}/restore`, "POST");
      setNotice("Workspace restored.");
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to restore workspace.");
    } finally {
      setSaving(false);
    }
  };

  const canManage = workspace.role === "owner" || workspace.role === "admin";
  if (!canManage) return null;

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Settings2 className="mr-2 size-4" aria-hidden="true" />
        {open ? "Hide workspace settings" : "Workspace settings"}
        {workspace.status === "archived" ? <Badge variant="outline" className="ml-auto">Archived</Badge> : null}
      </Button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          {notice ? <p role="status" className="text-xs text-muted-foreground">{notice}</p> : null}

          {workspace.status === "archived" ? (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">This workspace is archived. Project and collaboration access is suspended.</p>
              {workspace.role === "owner" ? (
                <Button type="button" size="sm" className="mt-3 w-full" onClick={() => void restoreWorkspace()} disabled={saving}>
                  {saving ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Undo2 className="mr-2 size-4" aria-hidden="true" />}
                  Restore workspace
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor={`workspace-name-${workspace.id}`}>Workspace name</Label>
                <Input id={`workspace-name-${workspace.id}`} value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} disabled={saving || workspace.role !== "owner" && workspace.role !== "admin"} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`workspace-visibility-${workspace.id}`}>Discoverability</Label>
                <select
                  id={`workspace-visibility-${workspace.id}`}
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as "private" | "discoverable")}
                  disabled={saving || workspace.isPersonal}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="private">Private — invitation only</option>
                  <option value="discoverable">Discoverable — members can request access</option>
                </select>
                {workspace.isPersonal ? <p className="text-[11px] text-muted-foreground">Personal workspaces remain private.</p> : null}
              </div>
              <Button type="button" size="sm" onClick={() => void saveSettings()} disabled={saving || (name.trim() === workspace.name && visibility === workspace.visibility)}>
                {saving ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 size-4" aria-hidden="true" />}
                Save settings
              </Button>

              {workspace.role === "owner" && !workspace.isPersonal ? (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground">Transfer ownership</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">The new owner must already be a workspace member. You will become an Admin.</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <select
                      aria-label="New workspace owner"
                      value={newOwnerId}
                      onChange={(event) => setNewOwnerId(event.target.value)}
                      onFocus={() => { if (!members.length) void loadMembers(); }}
                      disabled={saving || loadingMembers || members.length === 0}
                      className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">{loadingMembers ? "Loading members…" : "Choose a new owner"}</option>
                      {members.map((member) => <option key={member.userId} value={member.userId}>{member.email || member.displayName || member.userId}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => void transferOwnership()} disabled={saving || !newOwnerId}>
                      <ShieldCheck className="mr-2 size-4" aria-hidden="true" />
                      Transfer
                    </Button>
                  </div>
                </div>
              ) : null}

              {workspace.role === "owner" ? (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground">Archive workspace</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Archiving suspends project access. The owner can restore the workspace later.</p>
                  <Button type="button" variant="destructive" size="sm" className="mt-2 w-full" onClick={() => void archiveWorkspace()} disabled={saving}>
                    <Archive className="mr-2 size-4" aria-hidden="true" />
                    Archive workspace
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
