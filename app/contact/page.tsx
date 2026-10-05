import type { Metadata } from "next";\nimport { PublicShell } from "@/components/public/public-shell";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact page for Ediccrew Tech Stack Architect.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">TODO(owner): provide the real Ediccrew contact email or contact form destination.</p>
      <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-700 dark:text-amber-400">No email address is published here until the owner supplies a real address.</p>
    </div>
  );
}
