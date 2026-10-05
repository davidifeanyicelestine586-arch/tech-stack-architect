import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service placeholder for Ediccrew Tech Stack Architect.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <div className="mt-8 space-y-8 leading-relaxed text-muted-foreground">
        <section><h2 className="text-2xl font-semibold text-foreground">Legal review required</h2><p className="mt-3">TODO(owner/legal): replace this scaffold with reviewed terms, limitations, acceptable-use provisions, intellectual-property terms, and governing-law details.</p></section>
        <section><h2 className="text-2xl font-semibold text-foreground">Product scope</h2><p className="mt-3">The Architect provides deterministic technology-stack analysis, validation, and blueprint generation based on its registered catalog. TODO(owner/legal): define the applicable service commitments and disclaimers.</p></section>
      </div>
      </div>
    </PublicShell>
  );
}
