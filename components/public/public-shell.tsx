import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Boxes } from "lucide-react";
import Footer from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/"), description: SITE_DESCRIPTION }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Ediccrew", url: "https://ediccrew.com" }} />
      <a href="#public-main" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold shadow-lg transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 font-bold tracking-tight" aria-label="Ediccrew Tech Stack Architect home">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Boxes className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0 leading-tight"><span className="block text-sm sm:text-base">Tech Stack Architect</span><span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">by Ediccrew</span></span>
          </Link>
          <nav aria-label="Primary" className="flex w-full min-w-0 items-center gap-1 overflow-x-auto pb-0.5 text-sm sm:w-auto sm:flex-1 sm:justify-end lg:flex-nowrap" >
            <Link href="/technologies" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3">Technologies</Link>
            <Link href="/domains" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3">Domains</Link>
            <Link href="/stacks" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3">Stacks</Link>
            <Link href="/content-detail" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3">Documentation</Link>
            <Link href="/about" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3">About</Link>
            <Link href="/app" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-3.5 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-1 sm:px-4">Open the Architect <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>
      <main id="public-main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">{children}</main>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><Footer /></div>
    </div>
  );
}
