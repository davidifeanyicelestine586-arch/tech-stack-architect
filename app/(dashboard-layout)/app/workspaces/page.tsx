import type { Metadata } from "next";
import { WorkspaceManager } from "@/components/workspaces/workspace-manager";

export const metadata: Metadata = {
  title: "Workspaces",
  description: "Manage your Tech Stack Architect workspaces.",
  robots: { index: false, follow: false },
};

export default function WorkspacesPage() {
  return <WorkspaceManager />;
}
