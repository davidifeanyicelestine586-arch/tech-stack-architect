import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy placeholder for Ediccrew Tech Stack Architect, including account and saved-project data handling.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <div className="mt-8 space-y-8 leading-relaxed text-muted-foreground">
        <section><h2 className="text-2xl font-semibold text-foreground">Legal review required</h2><p className="mt-3">TODO(owner/legal): replace this scaffold with the reviewed privacy policy and applicable jurisdictional disclosures.</p></section>
        <section><h2 className="text-2xl font-semibold text-foreground">Account and project data</h2><p className="mt-3">The application supports email/password sign-up through Supabase. Saved projects are stored through the Supabase-backed project persistence layer. TODO(owner/legal): document retention, deletion, processing purposes, providers, and user rights.</p></section>
      </div>
      </div>
    </PublicShell>
  );
}
