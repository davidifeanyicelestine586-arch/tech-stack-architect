import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { PublicBreadcrumb } from "@/components/public/public-breadcrumb";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the maintainers of Ediccrew Tech Stack Architect through the project issue tracker.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl">
      <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">For product questions, bug reports, or feedback, contact the project maintainers through the public GitHub issue tracker.</p>
      <Link href="https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/issues/new" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-primary-foreground underline-offset-4 hover:underline">Contact the maintainers on GitHub</Link>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Please do not include passwords, access tokens, personal data, or other sensitive information in public issues.</p>
      </div>
    </PublicShell>
  );
}
