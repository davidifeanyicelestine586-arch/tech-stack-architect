import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, GitBranch, Layers3, ShieldCheck, Workflow } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getAllComponents, getAllDomains, getAllRecipes } from "@/lib/content/registry";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Technology Stack Architecture",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const WORKFLOW = [
  ["01", "Define", "Describe the product, constraints, team, and goals before choosing tools."],
  ["02", "Analyze", "Match the brief against registered technologies and deterministic rules."],
  ["03", "Review", "Understand why each recommendation fits and compare the trade-offs."],
  ["04", "Build", "Shape the proposed stack with a curated technology catalog."],
  ["05", "Validate", "Check dependencies, conflicts, and architecture constraints."],
  ["06", "Blueprint", "Turn a validated stack into a practical engineering handoff."],
] as const;

const PRINCIPLES = [
  { icon: ShieldCheck, title: "Rules you can inspect", text: "Compatibility and validation use registered metadata and explicit rules—not opaque guesses." },
  { icon: GitBranch, title: "Decisions with context", text: "Trace recommendations back to project needs, dependencies, constraints, and trade-offs." },
  { icon: Layers3, title: "A blueprint to build from", text: "Move from a considered stack to a structured architecture plan and starter guidance." },
];

export default function LandingPage() {
  const components = getAllComponents();
  const domains = getAllDomains();
  const recipes = getAllRecipes();
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/"), description: SITE_DESCRIPTION },
    { "@context": "https://schema.org", "@type": "Organization", name: "Ediccrew", url: "https://ediccrew.com" },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: SITE_NAME, applicationCategory: "DeveloperApplication", operatingSystem: "Web", description: SITE_DESCRIPTION, url: absoluteUrl("/") },
  ];

  return (
    <PublicShell>
      {jsonLd.map((data, index) => <JsonLd key={index} data={data} />)}
      <div className="space-y-24 pb-10 sm:space-y-28">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-sm">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_12%,color-mix(in_oklab,var(--primary)_13%,transparent),transparent_40%),linear-gradient(135deg,color-mix(in_oklab,var(--muted)_60%,transparent),transparent_58%)]" />
          <div className="grid gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12 lg:px-14 lg:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"><span className="size-1.5 rounded-full bg-primary" /> Architecture decisions, made explainable</div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Choose your stack with <span className="text-primary">clarity,</span> not guesswork.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{SITE_DESCRIPTION} Start with your project needs, understand the recommendations, and validate the architecture before you build.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/app#define" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Start your architecture <ArrowRight className="size-4" aria-hidden="true" /></Link>
                <Link href="/technologies" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-5 font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Explore the catalog <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                {["Registry-driven", "Explainable recommendations", "Compatibility-aware"].map((label) => <span key={label} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-primary" aria-hidden="true" />{label}</span>)}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/5 blur-2xl" aria-hidden="true" />
              <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Workflow className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold">Architecture workspace</p><p className="text-xs text-muted-foreground">Your project, one clear flow</p></div></div>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Ready to define</span>
                </div>
                <div className="space-y-3 p-4 sm:p-5">
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Start with the why</p>
                    <p className="mt-2 text-base font-semibold tracking-tight">What are you building?</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Describe the product, team, constraints, and outcomes that matter.</p>
                    <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">Web application</span><span className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">Small team</span><span className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">Production-ready</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStage number="01" title="Define" state="active" />
                    <MiniStage number="02" title="Analyze" state="next" />
                    <MiniStage number="03" title="Review" state="next" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/70 px-3.5 py-3"><div><p className="text-xs font-semibold">Your decisions stay traceable</p><p className="mt-0.5 text-[11px] text-muted-foreground">Recommendations · Rules · Validation</p></div><ArrowDownRight className="size-4 text-primary" aria-hidden="true" /></div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground"><span>Designed for engineering decisions</span><span>{components.length} registered technologies</span></div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border bg-muted/30">
            <Metric label="Technologies" value={components.length} />
            <Metric label="Project domains" value={domains.length} />
            <Metric label="Stack recipes" value={recipes.length} />
          </div>
        </section>

        <section aria-labelledby="principles-heading">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">A better way to choose</p><h2 id="principles-heading" className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Good architecture starts with good reasoning.</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Tools are only useful when they fit the problem. Tech Stack Architect helps you see the reasoning, check the edges, and leave with a plan you can explain.</p></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, text }, index) => <article key={title} className="group rounded-2xl border border-border bg-card p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary"><Icon className="size-5" aria-hidden="true" /></span><p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">0{index + 1} / Principle</p><h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></article>)}
          </div>
        </section>

        <section aria-labelledby="workflow-heading">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The workflow</p><h2 id="workflow-heading" className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">From first idea to build-ready blueprint.</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Each stage builds on the last. No mystery jumps, no unsupported shortcuts—just a clear path from requirements to validated decisions.</p></div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW.map(([number, title, description], index) => <li key={title} className="relative rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold text-primary">{number}</span>{index < WORKFLOW.length - 1 ? <ArrowUpRight className="size-4 text-muted-foreground/70" aria-hidden="true" /> : <Check className="size-4 text-primary" aria-hidden="true" />}</div><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></li>)}
          </ol>
        </section>

        <section aria-labelledby="explore-heading">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Explore the registry</p><h2 id="explore-heading" className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">A starting point for your next decision.</h2><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Browse technologies, understand the problem space, or start from a registered stack recipe.</p></div><Link href="/technologies" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted">Browse all technologies <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Project domains</h3><Link href="/domains" className="text-xs font-semibold text-primary hover:underline">All domains</Link></div><div className="mt-4 space-y-2">{domains.map((domain) => <Link key={domain.id} href={`/domains/${domain.id}`} className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-border hover:bg-muted/60"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xl" aria-hidden="true">{domain.icon}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{domain.title}</span><span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{domain.description}</span></span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>)}</div></div>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Stack recipes</h3><Link href="/stacks" className="text-xs font-semibold text-primary hover:underline">All stacks</Link></div><div className="mt-4 space-y-2">{recipes.slice(0, 4).map((recipe) => <Link key={recipe.id} href={`/stacks/${recipe.id}`} className="flex items-start gap-3 rounded-xl border border-transparent p-3 transition hover:border-border hover:bg-muted/60"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary"><Layers3 className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{recipe.title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{recipe.description}</span></span><ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>)}</div></div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12 lg:px-14"><div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 size-72 rounded-full border border-primary-foreground/10" /><div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-16 size-56 rounded-full border border-primary-foreground/10" /><div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/70">Start with the problem</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Make the next architecture decision with confidence.</h2><p className="mt-3 text-sm leading-6 text-primary-foreground/80 sm:text-base">Define your requirements, examine the reasoning, validate the stack, and leave with a blueprint your team can use.</p></div><Link href="/app#define" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-background px-5 font-semibold text-foreground transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-primary">Open the workspace <ArrowRight className="size-4" aria-hidden="true" /></Link></div></section>
      </div>
    </PublicShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="min-w-0 px-3 py-4 text-center sm:px-6 sm:py-5"><dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.16em]">{label}</dt><dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{value}</dd></div>;
}

function MiniStage({ number, title, state }: { number: string; title: string; state: "active" | "next" }) {
  return <div className={`rounded-xl border p-3 ${state === "active" ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}><p className={`text-[10px] font-semibold ${state === "active" ? "text-primary" : "text-muted-foreground"}`}>{number}</p><p className="mt-1 text-xs font-semibold">{title}</p><div className={`mt-3 h-1 rounded-full ${state === "active" ? "bg-primary" : "bg-muted"}`} /></div>;
}
