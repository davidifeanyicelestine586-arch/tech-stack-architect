"use client";

import { useState } from "react";
import { Activity, LoaderCircle, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";

type ActivityEvent = {
  id: string;
  actorEmail: string | null;
  action: string;
  subjectType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const describe = (event: ActivityEvent) => {
  switch (event.action) {
    case "workspace.created": return "Workspace created";
    case "workspace.member_added": return "Member added";
    case "workspace.member_role_changed": return "Member role changed";
    case "workspace.member_removed": return "Member removed";
    case "workspace.invitation_created": return "Invitation created";
    case "workspace.invitation_revoked": return "Invitation revoked";
    case "project.visibility_changed": return "Project visibility changed";
    case "project.admin_reassigned": return "Project administrator reassigned";
    case "project.member_added": return "Project member added";
    case "project.member_role_changed": return "Project member role changed";
    case "project.member_removed": return "Project member removed";
    default: return "Workspace activity";
  }
};

export function WorkspaceActivity({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to view workspace activity.");
      const response = await fetch(`/api/workspaces/${workspaceId}/activity`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to load activity.");
      setActivity(payload.data.activity);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load activity.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={toggle} aria-expanded={open}>
        <Activity className="mr-2 size-4" aria-hidden="true" />
        {open ? "Hide activity" : "Recent activity"}
      </Button>
      {open ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Latest workspace events</p>
            <Button type="button" size="icon" variant="ghost" aria-label="Refresh workspace activity" onClick={() => void load()} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          {loading ? <p className="text-xs text-muted-foreground">Loading activity…</p> : activity.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {activity.map((event) => (
                <li key={event.id} className="rounded-lg border border-border/70 px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{describe(event)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {event.actorEmail || "Workspace member"} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
}
