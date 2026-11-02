import type { ReactNode } from "react";
import Footer from "@/components/layout/footer";
import { ProductShellHeader } from "@/components/navigation/product-shell-header";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/"), description: SITE_DESCRIPTION }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Ediccrew", url: "https://ediccrew.com" }} />
      <a href="#public-main" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold shadow-lg transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary">Skip to main content</a>
      <ProductShellHeader />
      <main id="public-main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">{children}</main>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><Footer /></div>
    </div>
  );
}
