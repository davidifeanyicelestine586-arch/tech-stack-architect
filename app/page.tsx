import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { getAllComponents, getAllDomains, getAllRecipes } from "@/lib/content/registry";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Technology Stack Architecture",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const WORKFLOW = [
  ["Define", "Describe the project requirements, constraints, and goals."],
  ["Analyze", "Use deterministic registry rules to identify relevant technologies."],
  ["Review", "Compare recommendations and the reasons each technology fits."],
  ["Build", "Adjust the selected stack using the registered technology catalog."],
  ["Validate", "Check dependencies, conflicts, and architectural rules."],
  ["Blueprint", "Generate a development-ready architecture blueprint from the validated stack."],
] as const;

export default function LandingPage() {
  const components = getAllComponents();
  const domains = getAllDomains();
  const recipes = getAllRecipes();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
      description: SITE_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Ediccrew",
      url: "https://ediccrew.com",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      url: absoluteUrl("/"),
    },
  ];

  return (
    <>
      {jsonLd.map((data, index) => <JsonLd key={index} data={data} />)}
      <div className="space-y-16 pb-12">
        <section className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-xs md:p-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Ediccrew Tech Stack Architect</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Design a technology stack you can explain, validate, and build.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{SITE_DESCRIPTION} The recommendations and compatibility results come from the registered technology metadata and deterministic rules already in the product.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/app#define" className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground">Start your stack</Link>
              <Link href="/technologies" className="inline-flex min-h-11 items-center rounded-md border border-border px-5 font-semibold hover:bg-muted">Browse technologies</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catalog</p>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              <Metric label="Technologies" value={components.length} />
              <Metric label="Domains" value={domains.length} />
              <Metric label="Stack recipes" value={recipes.length} />
            </dl>
          </div>
        </section>

        <section aria-labelledby="workflow-heading">
          <h2 id="workflow-heading" className="text-2xl font-bold tracking-tight">From project idea to architecture blueprint</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">The Architect presents the workflow as six explicit stages so each result has a clear prerequisite and explanation.</p>
          <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW.map(([title, description], index) => (
              <li key={title} className="rounded-xl border border-border p-5">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">Step {index + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-2xl font-bold tracking-tight">Built around explainable architecture decisions</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Feature title="Deterministic validation" text="Checks dependencies, hardware conflicts, and architectural rules before a stack is treated as ready." />
            <Feature title="Explainable recommendations" text="Recommendations are matched against project requirements using the registered technology metadata." />
            <Feature title="Architecture blueprint" text="Turn a validated stack into an engineering blueprint, starter commands, and exportable documentation." />
          </div>
        </section>

        <section aria-labelledby="domains-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="domains-heading" className="text-2xl font-bold tracking-tight">Explore project domains</h2>
              <p className="mt-2 text-muted-foreground">Browse the registry by the three project domains already defined in the product.</p>
            </div>
            <Link href="/domains" className="text-sm font-semibold underline-offset-4 hover:underline">All domains</Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {domains.map((domain) => <Link key={domain.id} href={`/domains/${domain.id}`} className="rounded-xl border border-border p-5 hover:bg-muted"><span className="text-2xl" aria-hidden="true">{domain.icon}</span><h3 className="mt-3 font-semibold">{domain.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{domain.description}</p></Link>)}
          </div>
        </section>

        <section aria-labelledby="recipes-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="recipes-heading" className="text-2xl font-bold tracking-tight">Start from a stack recipe</h2>
              <p className="mt-2 text-muted-foreground">Open a registered recipe to see its components, learning goals, outputs, and starter commands.</p>
            </div>
            <Link href="/stacks" className="text-sm font-semibold underline-offset-4 hover:underline">All stacks</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recipes.slice(0, 3).map((recipe) => <Link key={recipe.id} href={`/stacks/${recipe.id}`} className="rounded-xl border border-border p-5 hover:bg-muted"><h3 className="font-semibold">{recipe.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{recipe.description}</p></Link>)}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/20 p-6 md:p-8" aria-labelledby="who-heading">
          <h2 id="who-heading" className="text-2xl font-bold tracking-tight">Who it is for</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">Tech Stack Architect is for people who need to turn project requirements into a structured technology-stack proposal, compare technologies, review recommendation factors, validate a proposed stack, and produce an architecture blueprint.</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/about" className="font-semibold underline-offset-4 hover:underline">About the Architect</Link>
            <Link href="https://ediccrew.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline-offset-4 hover:underline">Visit Ediccrew.com</Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-bold">{value}</dd></div>;
}

function Feature({ title, text }: { title: string; text: string }) {
  return <article className="rounded-xl border border-border p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></article>;
}
