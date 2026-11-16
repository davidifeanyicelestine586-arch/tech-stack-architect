"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDown, Boxes, RefreshCw, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTechStack } from "@/hooks/use-tech-stack";

const selectClassName = "mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground";

export function ArchitectureWizard() {
  const {
    projectDefinition,
    selectedComponents,
    architecture,
    setArchitecture,
    architectureValidation,
    isArchitectureStale,
    generateArchitecture,
  } = useTechStack();
  const [architectureStyle, setArchitectureStyle] = useState<"modular-monolith" | "service-oriented" | "serverless">("modular-monolith");
  const [deploymentModel, setDeploymentModel] = useState<"single-deployment" | "distributed" | "serverless">("single-deployment");
  const [dataFlowReviewed, setDataFlowReviewed] = useState(false);
  const [securityReviewed, setSecurityReviewed] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = () => {
    try {
      setError("");
      generateArchitecture({ architectureStyle, deploymentModel, dataFlowReviewed, securityReviewed });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Architecture could not be generated.");
    }
  };

  const updateResponsibility = (componentId: string, responsibility: string) => {
    if (!architecture) return;
    setArchitecture({
      ...architecture,
      components: architecture.components.map((component) =>
        component.id === componentId ? { ...component, responsibility } : component
      ),
    });
  };

  return (
    <section aria-labelledby="architecture-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Guided architecture design</p>
          <h2 id="architecture-heading" className="mt-1 text-lg font-bold tracking-tight text-foreground">Design how your system fits together</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">Architect builds a reviewable starting design from your selected technologies and their declared dependencies. It does not invent integrations or claim that the system has been tested.</p>
        </div>
        {architecture ? <Badge variant={isArchitectureStale ? "destructive" : "secondary"}>{isArchitectureStale ? "Needs regeneration" : "Architecture generated"}</Badge> : <Badge variant="outline">Not generated</Badge>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Step 1 · Choose the system shape</CardTitle>
          <CardDescription className="text-xs">These are starting proposals. Review the generated decisions before treating them as approved.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-foreground" htmlFor="architecture-style">
            Architecture style
            <select id="architecture-style" className={selectClassName} value={architectureStyle} onChange={(event) => setArchitectureStyle(event.target.value)}>
              <option value="modular-monolith">Modular monolith</option>
              <option value="service-oriented">Service-oriented</option>
              <option value="serverless">Serverless</option>
            </select>
          </label>
          <label className="text-sm font-medium text-foreground" htmlFor="deployment-model">
            Deployment model
            <select id="deployment-model" className={selectClassName} value={deploymentModel} onChange={(event) => setDeploymentModel(event.target.value)}>
              <option value="single-deployment">Single deployment</option>
              <option value="distributed">Distributed deployment</option>
              <option value="serverless">Managed serverless deployment</option>
            </select>
          </label>
          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="flex items-start gap-2 text-sm text-foreground">
              <input className="mt-0.5 size-4 accent-primary" type="checkbox" checked={dataFlowReviewed} onChange={(event) => setDataFlowReviewed(event.target.checked)} />
              <span><span className="font-medium">I have reviewed the data flow.</span><span className="block text-xs text-muted-foreground">This records your review; it does not automatically verify data ownership or access paths.</span></span>
            </label>
            <label className="flex items-start gap-2 text-sm text-foreground">
              <input className="mt-0.5 size-4 accent-primary" type="checkbox" checked={securityReviewed} onChange={(event) => setSecurityReviewed(event.target.checked)} />
              <span><span className="font-medium">I have reviewed identity, authorization, secrets, and trust boundaries.</span><span className="block text-xs text-muted-foreground">This is a user confirmation, not a security audit or penetration test.</span></span>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 md:col-span-2">
            <p className="text-xs text-muted-foreground">{selectedComponents.length} selected technologies · {projectDefinition.name.trim() || "Unnamed project"}</p>
            <Button type="button" onClick={handleGenerate} disabled={selectedComponents.length === 0}>
              {architecture ? <RefreshCw className="mr-2 size-4" aria-hidden="true" /> : <WandSparkles className="mr-2 size-4" aria-hidden="true" />}
              {architecture ? "Regenerate proposal" : "Generate architecture"}
            </Button>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p> : null}
        </CardContent>
      </Card>

      {!architecture ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex min-h-28 items-center gap-3 p-5">
            <Boxes className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div><p className="text-sm font-semibold text-foreground">Your architecture will appear here</p><p className="mt-1 text-xs text-muted-foreground">Select technologies, then generate a first-pass component map.</p></div>
          </CardContent>
        </Card>
      ) : (
        <>
          {isArchitectureStale ? (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>The project definition or selected stack has changed since this architecture was generated. Regenerate or review the architecture before creating a development plan. Your current edits are preserved.</span>
            </div>
          ) : null}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Step 2 · Review architecture components</CardTitle>
              <CardDescription className="text-xs">Responsibilities are editable. Technology assignments remain linked to the selected stack.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {architecture.components.map((component) => (
                  <div key={component.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{component.name}</p>
                      <Badge variant="outline" className="text-[10px]">{component.type}</Badge>
                    </div>
                    <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor={`responsibility-${component.id}`}>Responsibility</label>
                    <textarea id={`responsibility-${component.id}`} className="mt-1 min-h-20 w-full resize-y rounded-lg border border-input bg-background p-2 text-xs leading-relaxed text-foreground" value={component.responsibility} onChange={(event) => updateResponsibility(component.id, event.target.value)} />
                    <p className="mt-2 text-[11px] text-muted-foreground">Technology IDs: {component.technologyIds.join(", ")}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Step 3 · Inspect declared relationships</CardTitle><CardDescription className="text-xs">Only dependencies present in the technology registry are drawn automatically.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {architecture.relationships.length ? architecture.relationships.map((relationship) => {
                const source = architecture.components.find((component) => component.id === relationship.sourceId);
                const target = architecture.components.find((component) => component.id === relationship.targetId);
                return <div key={relationship.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-xs">
                  <span className="font-semibold text-foreground">{source?.name || relationship.sourceId}</span>
                  <ArrowDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="font-semibold text-foreground">{target?.name || relationship.targetId}</span>
                  <span className="ml-auto text-muted-foreground">{relationship.relationshipType}</span>
                  <p className="w-full text-muted-foreground">{relationship.description}</p>
                </div>;
              }) : <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">No dependency relationships were declared by the selected technologies. Add the actual communication paths during review.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Architecture decisions and open questions</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Decisions</h3><ul className="mt-2 space-y-2">{architecture.decisions.map((decision) => <li key={decision.id} className="rounded-lg border border-border p-3"><p className="text-xs font-semibold text-foreground">{decision.title}</p><p className="mt-1 text-xs text-foreground">{decision.decision}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{decision.rationale}</p></li>)}</ul></div>
              <div><h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Assumptions</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">{architecture.assumptions.map((item) => <li key={item}>{item}</li>)}</ul><h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Unresolved questions</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">{architecture.unresolvedQuestions.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </CardContent>
          </Card>

          {architectureValidation ? <ArchitectureValidationPanel /> : null}
        </>
      )}
    </section>
  );
}

function ArchitectureValidationPanel() {
  const { architectureValidation } = useTechStack();
  if (!architectureValidation) return null;
  const tone = architectureValidation.valid ? "secondary" : "destructive";
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">Architecture validation</CardTitle>
          <Badge variant={tone}>{architectureValidation.status}</Badge>
        </div>
        <CardDescription className="text-xs">{architectureValidation.summary} Score {architectureValidation.score}/100. This is a structural rules check, not proof of production readiness or security.</CardDescription>
      </CardHeader>
      <CardContent>
        {architectureValidation.findings.length ? <ul className="space-y-2">{architectureValidation.findings.map((item) => <li key={item.id} className="rounded-lg border border-border p-3"><div className="flex flex-wrap items-center gap-2"><Badge variant={item.severity === "error" ? "destructive" : "outline"}>{item.severity}</Badge><p className="text-xs font-semibold text-foreground">{item.title}</p></div><p className="mt-1 text-xs text-muted-foreground">{item.explanation}</p><p className="mt-2 text-xs text-foreground">Next: {item.recommendation}</p></li>)}</ul> : <p className="text-xs text-muted-foreground">No structural findings were reported by the current rules.</p>}
      </CardContent>
    </Card>
  );
}
