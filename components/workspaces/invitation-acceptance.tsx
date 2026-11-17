"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InvitationAcceptance({ token }: { token: string }) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const accept = async () => {
    if (!token || accepting) return;
    setAccepting(true);
    setError("");
    try {
      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Sign in with the invited email address before accepting this invitation.");

      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error?.message || "Unable to accept this invitation.");
      }
      setAccepted(true);
      window.setTimeout(() => router.push("/app"), 900);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to accept this invitation.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[55vh] w-full max-w-xl items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {accepted ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <ShieldCheck className="size-5" aria-hidden="true" />}
          </div>
          <CardTitle>{accepted ? "Invitation accepted" : "Join a workspace"}</CardTitle>
          <CardDescription>
            {accepted
              ? "Your membership is active. Taking you to your workspaces…"
              : "Accept this invitation using the account whose verified email address received it."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!token ? <p role="alert" className="text-sm text-destructive">This invitation link is missing its token.</p> : null}
          {error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          {accepted ? null : (
            <Button type="button" onClick={() => void accept()} disabled={!token || accepting}>
              {accepting ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Accept invitation
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
