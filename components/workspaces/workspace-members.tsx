"use client";

import { useState } from "react";
import { LoaderCircle, RefreshCw, ShieldCheck, UserRoundMinus, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Member = {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
};

export function WorkspaceMembers({
  workspaceId,
  workspaceRole,
}: {
  workspaceId: string;
  workspaceRole: Member["role"];
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const tokenAndUser = async () => {
    const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
    if (sessionError) throw sessionError;
    if (!data.session?.access_token) throw new Error("Sign in to view workspace members.");
    setCurrentUserId(data.session.user.id);
    return data.session.access_token;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await tokenAndUser();
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to load workspace members.");
      setMembers(payload.data.members);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load workspace members.");
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
    }
  };

  const updateRole = async (member: Member, role: "admin" | "member" | "viewer") => {
    setUpdatingId(member.userId);
    setError("");
    setNotice("");
    try {
      const token = await tokenAndUser();
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${member.userId}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ role }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to update member role.");
      setNotice("Member role updated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update member role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeMember = async (member: Member) => {
    if (!window.confirm(`Remove ${member.email || "this member"} from the workspace? Their project memberships will also be revoked.`)) return;
    setUpdatingId(member.userId);
    setError("");
    setNotice("");
    try {
      const token = await tokenAndUser();
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${member.userId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to remove workspace member.");
      setNotice("Member removed. Any sole Project Admin assignments were reassigned.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove workspace member.");
    } finally {
      setUpdatingId(null);
    }
  };

  const canManage = workspaceRole === "owner" || workspaceRole === "admin";

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={toggle} aria-expanded={open}>
        <Users className="mr-2 size-4" aria-hidden="true" />
        {open ? "Hide members" : "View members"}
      </Button>

      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          {notice ? <p role="status" className="text-xs text-muted-foreground">{notice}</p> : null}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Workspace members</p>
            <Button type="button" size="icon" variant="ghost" aria-label="Refresh workspace members" onClick={() => void load()} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          {loading ? <p className="text-xs text-muted-foreground">Loading members…</p> : members.length === 0 ? (
            <p className="text-xs text-muted-foreground">No workspace members found.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {members.map((member) => {
                const self = member.userId === currentUserId;
                const protectedAdmin = workspaceRole === "admin" && member.role === "admin";
                const canChange = canManage && !self && member.role !== "owner" && !protectedAdmin;
                return (
                  <li key={member.userId} className="flex flex-col gap-2 rounded-lg border border-border/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{member.displayName || member.email || "Workspace member"}{self ? " (you)" : ""}</p>
                      {member.displayName && member.email ? <p className="truncate text-[11px] text-muted-foreground">{member.email}</p> : null}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{member.role}</Badge>
                      {canChange ? (
                        <>
                          <select
                            aria-label={`Role for ${member.email || member.userId}`}
                            value={member.role}
                            onChange={(event) => void updateRole(member, event.target.value as "admin" | "member" | "viewer")}
                            disabled={updatingId !== null}
                            className="h-8 max-w-28 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${member.email || "member"}`} disabled={updatingId !== null} onClick={() => void removeMember(member)}>
                            {updatingId === member.userId ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <UserRoundMinus className="size-4" aria-hidden="true" />}
                          </Button>
                        </>
                      ) : null}
                      {member.role === "owner" ? <ShieldCheck className="size-4 text-muted-foreground" aria-label="Workspace owner" /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {canManage ? <p className="text-[11px] leading-relaxed text-muted-foreground">Admins cannot change or remove another admin. Only the owner can manage admin roles. Workspace ownership transfer is handled separately.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
