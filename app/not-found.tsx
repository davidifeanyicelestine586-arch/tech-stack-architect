import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-primary/10 text-primary mb-4"><Compass className="w-12 h-12" aria-hidden="true" /></div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-6">The page you are looking for does not exist in the Tech Stack Architect public layer or technology registry.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>Home</Link>
        <Button nativeButton={false} variant="outline" render={<Link href="/technologies" />}>Technologies</Link>
        <Button nativeButton={false} variant="outline" render={<Link href="/domains" />}>Domains</Link>
        <Button nativeButton={false} variant="outline" render={<Link href="/stacks" />}>Stacks</Link>
      </div>
    </div>
  );
}
