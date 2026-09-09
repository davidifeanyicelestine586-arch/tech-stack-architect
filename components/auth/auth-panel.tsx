"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const isAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthConfigured) return undefined;

    const client = getSupabaseBrowserClient();
    void client.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const client = getSupabaseBrowserClient();
      if (mode === "sign-in") {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setOpen(false);
        setPassword("");
      } else {
        const { data, error } = await client.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setPassword("");
        setMessage(data.session ? "Account created and signed in." : "Account created. Check your email if confirmation is required.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthConfigured) return null;

  if (user) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="hidden max-w-36 truncate text-[10px] font-medium text-muted-foreground sm:block" title={user.email ?? "Signed in"}>
          {user.email ?? "Signed in"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={() => void getSupabaseBrowserClient().auth.signOut()}
          aria-label="Sign out"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2 text-xs">
            <UserRound className="size-3.5" aria-hidden="true" />
            <span>Sign in</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "sign-in" ? "Sign in to save across devices" : "Create your account"}</DialogTitle>
          <DialogDescription>
            {mode === "sign-in"
              ? "Anonymous projects remain disposable. Sign in to attach saved projects to your account."
              : "Your account gives saved projects a durable owner instead of an anonymous browser session."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input id="auth-password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          </div>
          {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setMode((current) => current === "sign-in" ? "sign-up" : "sign-in"); setMessage(null); }}
            disabled={busy}
          >
            {mode === "sign-in" ? "Create account" : "Already have an account? Sign in"}
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={busy || !email.trim() || password.length < 6} className="gap-1.5">
            <LogIn className="size-3.5" aria-hidden="true" />
            {busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Sign up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
