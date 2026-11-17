import type { Metadata } from "next";
import { InvitationAcceptance } from "@/components/workspaces/invitation-acceptance";

export const metadata: Metadata = {
  title: "Accept workspace invitation",
  robots: { index: false, follow: false },
};

export default async function InvitationAcceptancePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <InvitationAcceptance token={token} />;
}
