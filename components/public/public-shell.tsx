import Link from "next/link";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="font-bold tracking-tight">
            Ediccrew Tech Stack Architect
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
            <Link href="/technologies" className="hover:underline">Technologies</Link>
            <Link href="/domains" className="hover:underline">Domains</Link>
            <Link href="/stacks" className="hover:underline">Stacks</Link>
            <Link href="/content-detail" className="hidden hover:underline sm:inline">Documentation</Link>
            <Link href="/" className="rounded-md border border-border px-3 py-2 font-semibold hover:bg-muted">
              Open the Architect
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>Ediccrew Tech Stack Architect</span>
          <Link href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
