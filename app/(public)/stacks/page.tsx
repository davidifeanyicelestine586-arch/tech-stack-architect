import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";
import { getAllRecipes, getDomain } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/seo/site";
import { breadcrumbJsonLd } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Stack Recipes",
  description: "Browse reusable stack recipes in Tech Stack Architect, including project goals, components, learning outcomes, and starter commands.",
  alternates: { canonical: "/stacks" },
};

export default function StacksPage() {
  const recipes = getAllRecipes();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", item: absoluteUrl("/") }, { name: "Stacks", item: absoluteUrl("/stacks") }])} />
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Stacks" }]} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Stack Recipes</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Compare the registered project templates and open a recipe for its complete component and learning context.</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => {
          const domain = getDomain(recipe.domain);
          return <article key={recipe.id} className="rounded-xl border border-border p-6"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{domain?.shortTitle ?? recipe.domain}</p><h2 className="mt-2 text-xl font-semibold"><Link href={`/stacks/${recipe.id}`} className="underline-offset-4 hover:underline">{recipe.title}</Link></h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{recipe.description}</p><p className="mt-4 text-xs text-muted-foreground">{recipe.difficulty} · {recipe.estimatedHours} hours</p></article>;
        })}
      </div>
    </>
  );
}
