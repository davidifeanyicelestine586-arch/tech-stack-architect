import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Interim service information for Ediccrew Tech Stack Architect. Final terms are pending owner and legal review.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <div className="mt-8 space-y-8 text-base leading-relaxed text-muted-foreground">
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-amber-800 dark:text-amber-300"><h2 className="text-lg font-semibold">Interim notice — review pending</h2><p className="mt-2">This page is not yet a complete set of terms of service. The service owner must approve the legal terms before this page can be treated as binding or final.</p></section>
        <section><h2 className="text-2xl font-semibold text-foreground">Product scope</h2><p className="mt-3">Tech Stack Architect provides technology-stack recommendations, compatibility validation, and architecture blueprint generation using its registered technology catalog and rules. Outputs are decision-support material and should be reviewed by a qualified person before being used in production systems.</p></section>
        <section><h2 className="text-2xl font-semibold text-foreground">Terms requiring owner and legal approval</h2><p className="mt-3">The final terms must identify the contracting entity, define permitted use, intellectual-property and user-content terms, service availability and support commitments, warranty and liability limits, termination, dispute resolution, and governing law. These provisions are not invented in this interim notice.</p></section>
      </div>
      </div>
    </PublicShell>
  );
}
