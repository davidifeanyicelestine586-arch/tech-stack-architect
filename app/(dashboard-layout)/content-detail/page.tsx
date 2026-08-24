import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, ShieldCheck } from "lucide-react";
import componentsData from "@/data/components.json";
import domainsData from "@/data/domain.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Documentation Registry | Ediccrew Tech Stack Architect",
  description:
    "Detailed specifications, dependencies, warnings, and outputs for the Ediccrew component registry.",
};

export default function ContentDetailPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 shadow-xs md:p-8">
        <Button
          variant="ghost"
          className="w-fit gap-2 px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
          render={<Link href="/" />}
        >
          <ArrowLeft className="size-3.5" />
          Back to Workspace
        </Button>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit gap-1 border-primary/30 text-[10px] text-primary">
              <ShieldCheck className="size-3" />
              Registry documentation
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Component Documentation
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Review the dependencies, constraints, learning estimates, and expected outputs that power stack validation and blueprint generation.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        {domainsData.map((domain) => {
          const domainComponents = componentsData.filter((component) => component.domain === domain.id);

          return (
            <Card key={domain.id} id={`domain-${domain.id}`}>
              <CardHeader className="border-b border-border/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{domain.title}</CardTitle>
                    <CardDescription className="mt-1 max-w-2xl">{domain.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {domainComponents.length} nodes
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                {domainComponents.map((component) => (
                  <article key={component.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">{component.name}</h2>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{component.description}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[9px]">{component.category}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {component.difficulty && <Badge variant="secondary" className="text-[9px]">{component.difficulty}</Badge>}
                      <Badge variant="secondary" className="gap-1 text-[9px]"><Clock className="size-3" />{component.estimatedLearningHours ?? 0}h</Badge>
                      <Badge variant="secondary" className="text-[9px]">Complexity {component.complexity ?? "—"}/5</Badge>
                    </div>

                    <div className="grid gap-2 text-[10px] text-muted-foreground">
                      <div><span className="font-semibold text-foreground">Required:</span> {component.requires?.join(", ") || "None"}</div>
                      <div><span className="font-semibold text-foreground">Outputs:</span> {component.outputs?.join(", ") || "None"}</div>
                    </div>

                    {component.warnings?.length ? (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] leading-relaxed text-amber-700 dark:text-amber-400">
                        <span className="font-semibold">Architectural warning:</span> {component.warnings.join(" ")}
                      </div>
                    ) : null}
                  </article>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
