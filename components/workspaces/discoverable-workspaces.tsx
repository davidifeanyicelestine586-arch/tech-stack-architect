"use client";

import { useState } from "react";
import { LoaderCircle, Search, UserRoundPlus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DiscoverableWorkspace = { id: string; name: string; createdAt: string };
type MyRequest = { id: string; workspaceId: string; workspaceName: string; status: string; requestedRole: string };

export function DiscoverableWorkspaces() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"member" | "viewer">("member");
  const [workspaces, setWorkspaces] = useState<DiscoverableWorkspace[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = async () => {
    const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
    if (sessionError) throw sessionError;
    if (!data.session?.access_token) throw new Error("Sign in to discover and request workspace access.");
    return data.session.access_token;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const accessToken = await token();
      const [workspaceResponse, requestResponse] = await Promise.all([
        fetch("/api/workspaces/discoverable?q=" + encodeURIComponent(search.trim()), {
          headers: { authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }),
        fetch("/api/workspaces/access-requests", {
          headers: { authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }),
      ]);
      const [workspacePayload, requestPayload] = await Promise.all([workspaceResponse.json(), requestResponse.json()]);
      if (!workspaceResponse.ok || workspacePayload?.ok !== true) throw new Error(workspacePayload?.error?.message || "Unable to search workspaces.");
      if (!requestResponse.ok || requestPayload?.ok !== true) throw new Error(requestPayload?.error?.message || "Unable to load your access requests.");
      setWorkspaces(workspacePayload.data.workspaces);
      setMyRequests(requestPayload.data.requests);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to discover workspaces.");
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async (workspace: DiscoverableWorkspace) => {
    setRequestingId(workspace.id);
    setError("");
    setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch(`/api/workspaces/${workspace.id}/access-requests`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ requestedRole: role }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error?.message || "Unable to request workspace access.");
      setNotice(`Access request sent to “${workspace.name}”.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to request workspace access.");
    } finally {
      setRequestingId(null);
    }
  };

  const pendingWorkspaceIds = new Set(myRequests.filter((request) => request.status === "pending").map((request) => request.workspaceId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Discover workspaces</CardTitle>
        <CardDescription>Find discoverable workspaces and request membership. Workspace owners or admins review each request.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {notice ? <p role="status" className="text-sm text-muted-foreground">{notice}</p> : null}
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="grid gap-1">
            <Label htmlFor="discover-workspace-search">Search by workspace name</Label>
            <Input id="discover-workspace-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={80} placeholder="Search workspaces…" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="discover-workspace-role">Requested role</Label>
            <select id="discover-workspace-role" value={role} onChange={(event) => setRole(event.target.value as "member" | "viewer")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button type="button" className="self-end" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Search className="mr-2 size-4" aria-hidden="true" />}
            Search
          </Button>
        </div>

        {workspaces.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {workspaces.map((workspace) => {
              const pending = pendingWorkspaceIds.has(workspace.id);
              return (
                <li key={workspace.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
                    <p className="text-[11px] text-muted-foreground">Discoverable workspace</p>
                  </div>
                  {pending ? <Badge variant="outline">Request pending</Badge> : (
                    <Button type="button" size="sm" onClick={() => void requestAccess(workspace)} disabled={requestingId !== null}>
                      {requestingId === workspace.id ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <UserRoundPlus className="mr-2 size-4" aria-hidden="true" />}
                      Request
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : !loading ? <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">No discoverable workspaces found. Try another search.</p> : null}

        {myRequests.length ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-foreground">Your access requests</p>
            <ul className="flex flex-col gap-2">
              {myRequests.slice(0, 5).map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground">{request.workspaceName}</span>
                  <Badge variant="outline" className="capitalize">{request.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
