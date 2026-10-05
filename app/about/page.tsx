import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";

export const metadata: Metadata = {
  title: "About",
  description: "Learn who builds Tech Stack Architect, how its registry works, and how deterministic recommendations support architecture decisions.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="text-4xl font-bold tracking-tight">About Tech Stack Architect</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Tech Stack Architect is built by Ediccrew to turn project requirements into a structured, explainable technology-stack proposal.</p>
      <div className="mt-10 space-y-8">
        <section><h2 className="text-2xl font-semibold">How it works</h2><p className="mt-3 leading-relaxed text-muted-foreground">Recommendations are deterministic and registry-based. The product uses the technology metadata already registered in its component catalog to match requirements, expose dependencies and optional technologies, surface conflicts and warnings, and support validation before a blueprint is generated.</p></section>
        <section><h2 className="text-2xl font-semibold">What you can explore</h2><p className="mt-3 leading-relaxed text-muted-foreground">The public catalog exposes the registered technologies, three project domains, and five stack recipes as individual pages so their relationships can be explored without opening the interactive workspace.</p></section>
      </div>
      <Link href="/app" className="mt-10 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-primary-foreground">Open the Architect workspace</Link>
      </div>
    </PublicShell>
  );
}
