import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";
import { getAllComponents, getComponent, getDomain, getRecipesUsingComponent } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/seo/site";
import { articleJsonLd, breadcrumbJsonLd, contentDescription } from "@/lib/seo/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllComponents().map((component) => ({ id: component.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const component = getComponent((await params).id);
  if (!component) return {};
  return {
    title: component.name,
    description: contentDescription(component.description),
    alternates: { canonical: `/technologies/${component.id}` },
  };
}

export default async function TechnologyPage({ params }: { params: Promise<{ id: string }> }) {
  const component = getComponent((await params).id);
  if (!component) notFound();

  const domain = getDomain(component.domain);
  if (!domain) notFound();

  const required = (component.requires ?? []).map(getComponent).filter(Boolean);
  const optional = (component.optional ?? []).map(getComponent).filter(Boolean);
  const conflicts = (component.conflicts ?? []).map((conflict) => typeof conflict === "string" ? { id: conflict, reason: undefined } : { id: conflict.component, reason: conflict.reason }).map((conflict) => ({ ...conflict, component: getComponent(conflict.id) })).filter((entry) => entry.component);
  const recipes = getRecipesUsingComponent(component.id);
  const url = absoluteUrl(`/technologies/${component.id}`);
  const breadcrumbs = [{ name: "Home", item: absoluteUrl("/") }, { name: "Technologies", item: absoluteUrl("/technologies") }, { name: component.name, item: url }];

  return (
    <>
      <JsonLd data={articleJsonLd({ headline: component.name, description: contentDescription(component.description), url, breadcrumbs })} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Technologies", href: "/technologies" }, { label: component.name }]} />
      <article>
        <header className="mb-8 max-w-4xl">
          <p className="text-sm font-semibold text-primary">{domain.title}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{component.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{component.description}</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Category" value={component.category} />
          <Stat label="Difficulty" value={component.difficulty ?? "Unspecified"} />
          <Stat label="Complexity" value={component.complexity ? `${component.complexity}/5` : "Unspecified"} />
          <Stat label="Learning time" value={component.estimatedLearningHours ? `${component.estimatedLearningHours} hours` : "Unspecified"} />
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <ListSection title="Required technologies" items={required.map((item) => <Link key={item!.id} href={`/technologies/${item!.id}`} className="underline-offset-4 hover:underline">{item!.name}</Link>)} />
          <ListSection title="Optional technologies" items={optional.map((item) => <Link key={item!.id} href={`/technologies/${item!.id}`} className="underline-offset-4 hover:underline">{item!.name}</Link>)} />
          <ListSection title="Conflicts" items={conflicts.map((entry) => <span key={entry.id}><Link href={`/technologies/${entry.component!.id}`} className="underline-offset-4 hover:underline">{entry.component!.name}</Link>{entry.reason ? ` — ${entry.reason}` : ""}</span>)} empty="None registered." />
          <ListSection title="Supports" items={(component.supports ?? []).map((item) => <span key={item}>{item}</span>)} />
          <ListSection title="Outputs" items={(component.outputs ?? []).map((item) => <span key={item}>{item}</span>)} />
          <ListSection title="Warnings" items={(component.warnings ?? []).map((item) => <span key={item}>{item}</span>)} empty="None registered." />
          <ListSection title="Tags" items={(component.tags ?? []).map((item) => <span key={item}>#{item}</span>)} />
        </div>
        <section className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold">Related stacks and domain</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href={`/domains/${domain.id}`} className="font-semibold underline-offset-4 hover:underline">{domain.title}</Link>
            {recipes.map((recipe) => <Link key={recipe.id} href={`/stacks/${recipe.id}`} className="font-semibold underline-offset-4 hover:underline">{recipe.title}</Link>)}
          </div>
        </section>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-primary-foreground">Add this to your stack in the Architect</Link>
      </article>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border p-4"><dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}

function ListSection({ title, items, empty = "None registered." }: { title: string; items: React.ReactNode[]; empty?: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length ? <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}
