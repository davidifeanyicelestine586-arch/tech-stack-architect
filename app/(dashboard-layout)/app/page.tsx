import type { Metadata } from "next";
import WorkspacePageClient from "./workspace-client";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Build, validate, and generate an architecture blueprint from a project definition and registered technology stack.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/app" },
};

export default function WorkspacePage() {
  return <WorkspacePageClient />;
}
