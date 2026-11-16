/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Export Engine
 * Version: 1.0.0
 * ============================================================
 *
 * Responsibilities
 * ----------------
 * ✓ Export JSON
 * ✓ Export Markdown
 * ✓ Export Summary
 * ✓ Download Files
 *
 */

export default class Exporter {

    /**
     * ----------------------------------------
     * JSON Export
     * ----------------------------------------
     */
    exportJSON(data) {

        return JSON.stringify(data, null, 2);

    }

    /**
     * ----------------------------------------
     * Markdown Export
     * ----------------------------------------
     */
    exportMarkdown(report) {

        let md = "";

        md += `# ${report.title || "Project Blueprint"}\n\n`;

        md += `## Status\n`;
        md += `- Score: ${report.score ?? "N/A"}\n`;
        md += `- Status: ${report.status ?? "Unknown"}\n\n`;

        if (report.project) {

            md += `## Project Definition\n`;
            if (report.project.name) md += `- Name: ${report.project.name}\n`;
            if (report.project.description) md += `- Description: ${report.project.description}\n`;
            if (report.project.domain) md += `- Project type/domain: ${report.project.domain}\n`;
            if (report.project.difficulty) md += `- Difficulty preference: ${report.project.difficulty}\n`;
            if (report.project.requirements) md += `- Goals and requirements: ${report.project.requirements}\n`;
            md += `\n`;

        }

        if (report.validation) {

            md += `## Validation Details\n`;
            md += `- Valid: ${report.validation.valid ? "Yes" : "No"}\n`;
            md += `- Score: ${report.validation.score ?? "N/A"}\n`;
            md += `- Status: ${report.validation.status ?? "Unknown"}\n`;
            if (report.validation.missingDependencies?.length) {
                md += `- Missing dependencies: ${report.validation.missingDependencies.join(", ")}\n`;
            }
            if (report.validation.conflicts?.length) {
                md += `- Conflicts: ${report.validation.conflicts.join(" | ")}\n`;
            }
            md += `\n`;

        }

        if (report.architecture) {

            md += `## Architecture Specification\n\n`;
            if (report.architecture.decisions?.length) {
                md += `### Architecture Decisions\n`;
                report.architecture.decisions.forEach(decision => {
                    md += `- **${decision.title}:** ${decision.decision} — ${decision.rationale}\n`;
                });
                md += `\n`;
            }
            if (report.architecture.components?.length) {
                md += `### Components and Responsibilities\n`;
                report.architecture.components.forEach(component => {
                    md += `- **${component.name}** (${component.type}): ${component.responsibility}\n`;
                });
                md += `\n`;
            }
            if (report.architecture.relationships?.length) {
                md += `### Declared Relationships\n`;
                report.architecture.relationships.forEach(relationship => {
                    md += `- ${relationship.sourceId} → ${relationship.targetId} (${relationship.relationshipType}): ${relationship.description}\n`;
                });
                md += `\n`;
            }
            if (report.architecture.assumptions?.length) {
                md += `### Assumptions\n`;
                report.architecture.assumptions.forEach(item => { md += `- ${item}\n`; });
                md += `\n`;
            }
            if (report.architecture.unresolvedQuestions?.length) {
                md += `### Unresolved Questions\n`;
                report.architecture.unresolvedQuestions.forEach(item => { md += `- ${item}\n`; });
                md += `\n`;
            }

        }

        if (report.architectureValidation) {
            md += `## Architecture Validation\n`;
            md += `- Valid: ${report.architectureValidation.valid ? "Yes" : "No"}\n`;
            md += `- Score: ${report.architectureValidation.score}/100\n`;
            md += `- Status: ${report.architectureValidation.status}\n`;
            report.architectureValidation.findings?.forEach(item => {
                md += `- [${item.severity.toUpperCase()}] ${item.title}: ${item.explanation} Recommendation: ${item.recommendation}\n`;
            });
            md += `\n`;
        }

        if (report.developmentPlan) {
            md += `## Development Roadmap\n\n`;
            report.developmentPlan.phases?.forEach(phase => {
                md += `### ${phase.title}\n`;
                md += `${phase.objective}\n`;
                phase.deliverables?.forEach(deliverable => { md += `- Deliverable: ${deliverable}\n`; });
                const phaseTasks = (report.developmentPlan.tasks || []).filter(task => phase.taskIds.includes(task.id));
                phaseTasks.forEach(task => {
                    md += `\n#### ${task.title}\n`;
                    md += `${task.description}\n`;
                    if (task.dependsOn?.length) md += `- Prerequisites: ${task.dependsOn.join(", ")}\n`;
                    task.acceptanceCriteria?.forEach(item => { md += `- Acceptance: ${item}\n`; });
                    task.deliverables?.forEach(item => { md += `- Output: ${item}\n`; });
                    task.suggestedTests?.forEach(item => { md += `- Suggested test: ${item}\n`; });
                });
                md += `\n`;
            });
        }

        if (report.domain) {

            md += `## Domain\n`;
            md += `${report.domain}\n\n`;

        }

        if (report.components?.length) {

            md += `## Components\n`;

            report.components.forEach(component => {

                md += `- ${component.name}\n`;

            });

            md += `\n`;

        }

        if (report.learningGoals?.length) {

            md += `## Learning Goals\n`;

            report.learningGoals.forEach(goal => {

                md += `- ${goal}\n`;

            });

            md += `\n`;

        }

        if (report.outputs?.length) {

            md += `## Expected Outputs\n`;

            report.outputs.forEach(output => {

                md += `- ${output}\n`;

            });

            md += `\n`;

        }

        if (report.warnings?.length) {

            md += `## Warnings\n`;

            report.warnings.forEach(warning => {

                md += `- ${warning.message || warning}\n`;

            });

            md += `\n`;

        }

        if (report.suggestions?.length) {

            md += `## Recommendations\n`;

            report.suggestions.forEach(item => {

                md += `- ${item}\n`;

            });

            md += `\n`;

        }

        if (report.starterCommands?.length) {

            md += `## Starter Commands\n\n`;

            md += "```bash\n";

            report.starterCommands.forEach(cmd => {

                md += `${cmd}\n`;

            });

            md += "```\n";

        }

        return md;

    }

    /**
     * ----------------------------------------
     * Human Summary
     * ----------------------------------------
     */
    exportSummary(report) {

        return {

            title: report.title,

            status: report.status,

            score: report.score,

            components:
                report.components?.length || 0,

            warnings:
                report.warnings?.length || 0,

            recommendations:
                report.suggestions?.length || 0

        };

    }

    /**
     * ----------------------------------------
     * Download
     * ----------------------------------------
     */
    download(filename, content, type = "text/plain") {

        const blob = new Blob(
            [content],
            { type }
        );

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;

        a.download = filename;

        document.body.appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(url);

    }

    /**
     * ----------------------------------------
     * Export JSON File
     * ----------------------------------------
     */
    downloadJSON(filename, report) {

        this.download(

            filename,

            this.exportJSON(report),

            "application/json"

        );

    }

    /**
     * ----------------------------------------
     * Export Markdown File
     * ----------------------------------------
     */
    downloadMarkdown(filename, report) {

        this.download(

            filename,

            this.exportMarkdown(report),

            "text/markdown"

        );

    }

}