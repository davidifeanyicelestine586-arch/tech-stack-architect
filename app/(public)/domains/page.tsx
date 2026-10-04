import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";
import { getAllDomains, getComponentsByDomain, getRecipesByDomain } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/seo/site";
import { breadcrumbJsonLd } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Domains",
  description: "Explore the three project domains in Tech Stack Architect and browse the technologies and stack recipes registered for each one.",
  alternates: { canonical: "/domains" },
};

export default function DomainsPage() {
  const domains = getAllDomains();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", item: absoluteUrl("/") }, { name: "Domains", item: absoluteUrl("/domains") }])} />
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Domains" }]} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Start with a project domain, then move from its technology catalog to reusable stack recipes.</p>
      </header>
      <div className="grid gap-5 md:grid-cols-3">
        {domains.map((domain) => {
          const componentCount = getComponentsByDomain(domain.id).length;
          const recipeCount = getRecipesByDomain(domain.id).length;
          return (
            <article key={domain.id} className="rounded-xl border border-border p-6">
              <p className="text-2xl" aria-hidden="true">{domain.icon}</p>
              <h2 className="mt-3 text-xl font-semibold"><Link href={`/domains/${domain.id}`} className="underline-offset-4 hover:underline">{domain.title}</Link></h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{domain.description}</p>
              <p className="mt-4 text-xs text-muted-foreground">{componentCount} technologies · {recipeCount} stack recipes</p>
            </article>
          );
        })}
      </div>
    </>
  );
}
