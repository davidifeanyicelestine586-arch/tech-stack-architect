import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";
import { getAllRecipes, getRecipe, getDomain, getComponent } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/seo/site";
import { articleJsonLd, breadcrumbJsonLd, contentDescription } from "@/lib/seo/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllRecipes().map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const recipe = getRecipe((await params).id);
  if (!recipe) return {};
  return { title: recipe.title, description: contentDescription(recipe.description), alternates: { canonical: `/stacks/${recipe.id}` } };
}

export default async function StackPage({ params }: { params: Promise<{ id: string }> }) {
  const recipe = getRecipe((await params).id);
  if (!recipe) notFound();
  const domain = getDomain(recipe.domain);
  if (!domain) notFound();
  const components = recipe.components.map(getComponent).filter(Boolean);
  const recommended = (recipe.recommended ?? []).map(getComponent).filter(Boolean);
  const url = absoluteUrl(`/stacks/${recipe.id}`);
  const breadcrumbs = [{ name: "Home", item: absoluteUrl("/") }, { name: "Stacks", item: absoluteUrl("/stacks") }, { name: recipe.title, item: url }];
  return (
    <>
      <JsonLd data={articleJsonLd({ headline: recipe.title, description: contentDescription(recipe.description), url, breadcrumbs })} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Stacks", href: "/stacks" }, { label: recipe.title }]} />
      <article>
        <header className="mb-8 max-w-4xl">
          <p className="text-sm font-semibold text-primary">{domain.title}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{recipe.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{recipe.description}</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Difficulty" value={recipe.difficulty} />
          <Stat label="Estimated time" value={`${recipe.estimatedHours} hours`} />
          <Stat label="Project types" value={recipe.projectTypes.join(", ")} />
        </div>
        <section className="mt-10" aria-labelledby="components-heading">
          <h2 id="components-heading" className="text-2xl font-semibold">Components</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {components.map((component) => <Link key={component!.id} href={`/technologies/${component!.id}`} className="rounded-xl border border-border p-4 hover:bg-muted"><span className="font-semibold">{component!.name}</span><span className="mt-1 block text-sm text-muted-foreground">{component!.description}</span></Link>)}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Recommended additions</h2>
          <div className="mt-4 flex flex-wrap gap-3">{recommended.map((component) => <Link key={component!.id} href={`/technologies/${component!.id}`} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">{component!.name}</Link>)}</div>
        </section>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <List title="Learning goals" items={recipe.learningGoals} />
          <List title="Expected outputs" items={recipe.expectedOutputs} />
          <List title="Starter commands" items={recipe.starterCommands} />
          <List title="Warnings" items={recipe.warnings} />
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href={`/domains/${domain.id}`} className="font-semibold underline-offset-4 hover:underline">Explore {domain.title}</Link>
          <Link href="/app" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-primary-foreground">Use this recipe in the Architect</Link>
        </div>
      </article>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <section><h2 className="text-lg font-semibold">{title}</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
