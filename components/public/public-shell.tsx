import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">\n      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/"), description: SITE_DESCRIPTION }} />\n      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Ediccrew", url: "https://ediccrew.com" }} />
      <a href="#public-main" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold shadow-lg transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary">Skip to main content</a>
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="min-w-0 max-w-full break-words font-bold tracking-tight" aria-label="Ediccrew Tech Stack Architect home">Ediccrew Tech Stack Architect</Link>
          <nav aria-label="Primary" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:w-auto">
            <Link href="/technologies" className="min-h-11 inline-flex items-center px-1 hover:underline">Technologies</Link>
            <Link href="/domains" className="min-h-11 inline-flex items-center px-1 hover:underline">Domains</Link>
            <Link href="/stacks" className="min-h-11 inline-flex items-center px-1 hover:underline">Stacks</Link>
            <Link href="/content-detail" className="inline-flex min-h-11 items-center px-1 hover:underline">Documentation</Link>
            <Link href="/about" className="inline-flex min-h-11 items-center px-1 hover:underline">About</Link>
            <Link href="/app" className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 font-semibold text-primary-foreground">Open the Architect</Link>
          </nav>
        </div>
      </header>
      <main id="public-main" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6"><Footer /></div>
    </div>
  );
}
