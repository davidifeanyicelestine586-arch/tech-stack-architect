import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";
import { getAllDomains, getDomain, getComponentsByDomain, getRecipesByDomain } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/seo/site";
import { articleJsonLd, breadcrumbJsonLd, contentDescription } from "@/lib/seo/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDomains().map((domain) => ({ id: domain.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const domain = getDomain((await params).id);
  if (!domain) return {};
  return { title: domain.title, description: contentDescription(domain.description), alternates: { canonical: `/domains/${domain.id}` } };
}

export default async function DomainPage({ params }: { params: Promise<{ id: string }> }) {
  const domain = getDomain((await params).id);
  if (!domain) notFound();
  const components = getComponentsByDomain(domain.id);
  const recipes = getRecipesByDomain(domain.id);
  const url = absoluteUrl(`/domains/${domain.id}`);
  const breadcrumbs = [{ name: "Home", item: absoluteUrl("/") }, { name: "Domains", item: absoluteUrl("/domains") }, { name: domain.title, item: url }];
  return (
    <>
      <JsonLd data={articleJsonLd({ headline: domain.title, description: contentDescription(domain.description), url, breadcrumbs })} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Domains", href: "/domains" }, { label: domain.title }]} />
      <article>
        <header className="mb-8 max-w-4xl">
          <p className="text-2xl" aria-hidden="true">{domain.icon}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{domain.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{domain.description}</p>
        </header>
        <section aria-labelledby="technologies-heading">
          <h2 id="technologies-heading" className="text-2xl font-semibold">Technologies in this domain</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {components.map((component) => <Link key={component.id} href={`/technologies/${component.id}`} className="rounded-xl border border-border p-4 hover:bg-muted"><span className="font-semibold">{component.name}</span><span className="mt-1 block text-sm text-muted-foreground">{component.description}</span></Link>)}
          </div>
        </section>
        <section className="mt-10" aria-labelledby="stacks-heading">
          <h2 id="stacks-heading" className="text-2xl font-semibold">Stack recipes in this domain</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recipes.map((recipe) => <Link key={recipe.id} href={`/stacks/${recipe.id}`} className="rounded-xl border border-border p-4 hover:bg-muted"><span className="font-semibold">{recipe.title}</span><span className="mt-1 block text-sm text-muted-foreground">{recipe.description}</span></Link>)}
          </div>
        </section>
        <Link href="/app" className="mt-10 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-primary-foreground">Open the Architect workspace</Link>
      </article>
    </>
  );
}
