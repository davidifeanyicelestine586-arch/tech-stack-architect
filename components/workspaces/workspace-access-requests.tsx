"use client";

import { useState } from "react";
import { Check, LoaderCircle, RefreshCw, UserCheck, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AccessRequest = {
  id: string;
  email: string | null;
  displayName: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  requestedRole: "member" | "viewer";
  createdAt: string;
};

export function WorkspaceAccessRequests({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to review access requests.");
      const response = await fetch(`/api/workspaces/${workspaceId}/access-requests`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to load access requests.");
      setRequests(payload.data.requests);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load access requests.");
    } finally {
      setLoading(false);
    }
  };

  const review = async (request: AccessRequest, decision: "approve" | "reject") => {
    setProcessingId(request.id);
    setError("");
    setNotice("");
    try {
      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to review access requests.");
      const response = await fetch(`/api/workspaces/${workspaceId}/access-requests/${request.id}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ decision, role: request.requestedRole }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to review access request.");
      setNotice(decision === "approve" ? "Access request approved." : "Access request rejected.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review access request.");
    } finally {
      setProcessingId(null);
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

  const pending = requests.filter((request) => request.status === "pending");

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={toggle} aria-expanded={open}>
        <UserCheck className="mr-2 size-4" aria-hidden="true" />
        {open ? "Hide access requests" : "Access requests"}
        {pending.length ? <Badge variant="secondary" className="ml-auto">{pending.length}</Badge> : null}
      </Button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          {notice ? <p role="status" className="text-xs text-muted-foreground">{notice}</p> : null}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Pending requests</p>
            <Button type="button" size="icon" variant="ghost" aria-label="Refresh access requests" onClick={() => void load()} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          {loading ? <p className="text-xs text-muted-foreground">Loading requests…</p> : pending.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending access requests.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.map((request) => (
                <li key={request.id} className="rounded-lg border border-border/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{request.displayName || request.email || "Workspace applicant"}</p>
                      {request.displayName && request.email ? <p className="truncate text-[11px] text-muted-foreground">{request.email}</p> : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">Requested {request.requestedRole} · {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  {request.message ? <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">{request.message}</p> : null}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button type="button" size="sm" onClick={() => void review(request, "approve")} disabled={processingId !== null}>
                      {processingId === request.id ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Check className="mr-2 size-4" aria-hidden="true" />}
                      Approve as {request.requestedRole}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void review(request, "reject")} disabled={processingId !== null}>
                      <X className="mr-2 size-4" aria-hidden="true" />
                      Reject
                    </Button>
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
