"use client";

import { useState, type FormEvent } from "react";
import { ClipboardCopy, LoaderCircle, MailPlus, RefreshCw, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Invitation = {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
};

export function WorkspaceInvitations({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Invitation["role"]>("member");
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const accessToken = async () => {
    const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
    if (sessionError) throw sessionError;
    if (!data.session?.access_token) throw new Error("Sign in to manage workspace invitations.");
    return data.session.access_token;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to load invitations.");
      setInvitations(payload.data.invitations);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
    else {
      setError("");
      setNotice("");
      setInviteUrl("");
    }
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError("");
    setNotice("");
    setInviteUrl("");
    try {
      const token = await accessToken();
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to create invitation.");
      setEmail("");
      setInviteUrl(payload.data.inviteUrl);
      setNotice(`Invitation created for ${payload.data.invitation.email}. Copy the link and send it to them.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create invitation.");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (invitationId: string) => {
    setError("");
    setNotice("");
    try {
      const token = await accessToken();
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to revoke invitation.");
      setNotice(payload.data.revoked ? "Invitation revoked." : "This invitation is no longer pending.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to revoke invitation.");
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setNotice("Invitation link copied.");
    } catch {
      setError("Could not copy the invitation link. Select and copy it manually.");
    }
  };

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={toggle} aria-expanded={open}>
        <MailPlus className="mr-2 size-4" aria-hidden="true" />
        {open ? "Hide invitations" : "Manage invitations"}
      </Button>

      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          {notice ? <p role="status" className="text-xs text-muted-foreground">{notice}</p> : null}

          <form onSubmit={create} className="grid gap-2 rounded-lg border border-border/70 p-3">
            <Label htmlFor={`invite-email-${workspaceId}`}>Invite by email</Label>
            <Input
              id={`invite-email-${workspaceId}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
              required
              maxLength={254}
              disabled={creating}
            />
            <Label htmlFor={`invite-role-${workspaceId}`}>Workspace role</Label>
            <select
              id={`invite-role-${workspaceId}`}
              value={role}
              onChange={(event) => setRole(event.target.value as Invitation["role"])}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              disabled={creating}
            >
              <option value="member">Member — can create and edit shared projects</option>
              <option value="viewer">Viewer — can view shared projects</option>
              <option value="admin">Admin — can manage workspace settings and invitations</option>
            </select>
            <Button type="submit" size="sm" disabled={creating || !email.trim()}>
              {creating ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <MailPlus className="mr-2 size-4" aria-hidden="true" />}
              Create invitation link
            </Button>
          </form>

          {inviteUrl ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Share this one-time invitation link</p>
              <p className="break-all text-xs text-muted-foreground">{inviteUrl}</p>
              <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => void copyInviteLink()}>
                <ClipboardCopy className="mr-2 size-4" aria-hidden="true" />
                Copy invitation link
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Invitations</p>
            <Button type="button" size="icon" variant="ghost" aria-label="Refresh invitations" onClick={() => void load()} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          {loading ? <p className="text-xs text-muted-foreground">Loading invitations…</p> : invitations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No invitations yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{invitation.email}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="outline">{invitation.status}</Badge>
                    {invitation.status === "pending" ? (
                      <Button type="button" variant="ghost" size="icon" aria-label={`Revoke invitation for ${invitation.email}`} onClick={() => void revoke(invitation.id)}>
                        <XCircle className="size-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
