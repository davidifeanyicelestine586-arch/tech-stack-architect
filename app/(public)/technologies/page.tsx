import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";
import { getAllComponents, getAllDomains } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/seo/site";
import { breadcrumbJsonLd } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Technologies",
  description: "Browse the registered technologies used by Tech Stack Architect, grouped by project domain and linked to their dependencies and stack recipes.",
  alternates: { canonical: "/technologies" },
};

export default function TechnologiesPage() {
  const components = getAllComponents();
  const domains = getAllDomains();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", item: absoluteUrl("/") }, { name: "Technologies", item: absoluteUrl("/technologies") }])} />
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Technologies" }]} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Technologies</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Explore the registered technology components that power deterministic recommendations, validation, and architecture blueprints.</p>
      </header>
      <div className="space-y-10">
        {domains.map((domain) => {
          const items = components.filter((component) => component.domain === domain.id);
          return (
            <section key={domain.id} aria-labelledby={`domain-${domain.id}`}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 id={`domain-${domain.id}`} className="text-xl font-semibold">{domain.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{domain.description}</p>
                </div>
                <Link className="text-sm font-semibold underline-offset-4 hover:underline" href={`/domains/${domain.id}`}>View domain</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((component) => (
                  <article key={component.id} className="rounded-xl border border-border p-5">
                    <h3 className="font-semibold"><Link href={`/technologies/${component.id}`} className="underline-offset-4 hover:underline">{component.name}</Link></h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{component.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{component.category} · {component.difficulty ?? "Unspecified"}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Catalog: {components.length} technologies across {domains.length} domains.</p>
    </>
  );
}
