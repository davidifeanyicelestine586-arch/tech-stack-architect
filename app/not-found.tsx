import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
        <Compass className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404 - Blueprint Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        The architectural route or module you are looking for does not exist in the technology registry.
      </p>
      <Button asChild>
        <Link href="/">Return to Workspace</Link>
      </Button>
    </div>
  );
}
