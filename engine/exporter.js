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