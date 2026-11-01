const DEFAULT_HEADING = "# Remaining pages and shared UI accessibility audit";

export function formatAuditReportHeading(label = "") {
  const normalizedLabel = String(label ?? "").trim().replace(/\s+/g, " ");
  if (!normalizedLabel) return DEFAULT_HEADING;
  return `# ${normalizedLabel} — Remaining pages and shared UI audit`;
}
