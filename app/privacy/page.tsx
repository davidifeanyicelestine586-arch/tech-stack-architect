import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Interim privacy information for Ediccrew Tech Stack Architect. Full policy publication is pending owner and legal review.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <div className="mt-8 space-y-8 text-base leading-relaxed text-muted-foreground">
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-amber-800 dark:text-amber-300"><h2 className="text-lg font-semibold">Interim notice — review pending</h2><p className="mt-2">This page is not yet a complete privacy policy. The service owner must review and publish the applicable legal disclosures before this page can be treated as the final policy.</p></section>
        <section><h2 className="text-2xl font-semibold text-foreground">Account and project information</h2><p className="mt-3">The application provides email/password account sign-up and a saved-project workflow backed by Supabase. If you choose to use those features, account information and saved project content are processed by the application and its configured Supabase service.</p></section>
        <section><h2 className="text-2xl font-semibold text-foreground">Details still requiring owner confirmation</h2><p className="mt-3">The final policy must specify the responsible legal entity and contact, processing purposes and legal bases, data categories, retention periods, deletion procedures, service providers, applicable user rights, and jurisdiction-specific disclosures. Those terms are intentionally not guessed here.</p></section>
      </div>
      </div>
    </PublicShell>
  );
}
