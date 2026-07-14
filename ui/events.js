/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Event Binding Engine
 * Version: 1.0.0
 * ============================================================
 */

import State from "./state.js";

import Renderer from "./renderer.js";

export default class Events {

    static initialize() {

        // Mobile Inspector Toggle Button

        const mobileInspectorToggle = document.getElementById("mobileInspectorToggle");

        const inspectorElement = document.querySelector(".inspector");

        if (mobileInspectorToggle && inspectorElement) {

            mobileInspectorToggle.addEventListener("click", (e) => {

                e.stopPropagation();

                inspectorElement.classList.toggle("active");

            });

            // Close the inspector if user clicks anywhere outside

            document.addEventListener("click", (e) => {

                if (!inspectorElement.contains(e.target) && e.target !== mobileInspectorToggle && !mobileInspectorToggle.contains(e.target)) {

                    inspectorElement.classList.remove("active");

                }

            });

        }

        // Search Input

        const searchInput = document.getElementById("searchInput");

        if (searchInput) {

            searchInput.addEventListener("input", (e) => {

                State.setSearch(e.target.value);

                Renderer.render();

            });

        }

        // Generate Custom Blueprint Button

        const generateBtn = document.getElementById("generateButton");

        if (generateBtn) {

            generateBtn.addEventListener("click", () => {

                if (State.selectedComponents.length === 0) {

                    alert("Please select at least one component to generate a custom blueprint.");

                    return;

                }

                // Compile selected component metadata for custom blueprint

                const selectedObjects = State.selectedComponents

                    .map(id => State.components.find(c => c.id === id))

                    .filter(Boolean);

                const totalHours = selectedObjects.reduce((sum, c) => sum + (c.estimatedLearningHours || 0), 0);

                const maxComplexity = selectedObjects.reduce((max, c) => Math.max(max, c.complexity || 1), 1);

                let customDifficulty = "Beginner";

                if (maxComplexity >= 4) customDifficulty = "Advanced";

                else if (maxComplexity >= 3) customDifficulty = "Intermediate";

                const allOutputs = [...new Set(selectedObjects.flatMap(c => c.outputs || []))];

                const allLearningGoals = selectedObjects.map(c => `Learn integration and deployment of ${c.name}`);

                const commands = [

                    "# Custom Stack Initializer Script",

                    "mkdir ediccrew-custom-stack",

                    "cd ediccrew-custom-stack",

                    "# Selected components configurations:",

                    ...selectedObjects.map(c => `# - Setup ${c.name} (${c.category})`)

                ];

                State.blueprint = {

                    id: "custom-blueprint",

                    title: "Custom Tech Stack Blueprint",

                    description: `A custom designed technology architecture comprising ${selectedObjects.length} components.`,

                    domain: State.activeDomain || "web-saas",

                    difficulty: customDifficulty,

                    estimatedHours: totalHours || 8,

                    components: selectedObjects,

                    learningGoals: allLearningGoals.length > 0 ? allLearningGoals : ["Build custom integrations"],

                    outputs: allOutputs.length > 0 ? allOutputs : ["architecture", "starter-code"],

                    starterCommands: commands,

                    warnings: State.report?.warnings?.map(w => w.message) || []

                };

                Renderer.render();

                const blueprintPanel = document.getElementById("blueprintPanel");

                if (blueprintPanel) {

                    blueprintPanel.scrollIntoView({ behavior: "smooth" });

                }

                // Close mobile drawer on generate
                if (inspectorElement) {

                    inspectorElement.classList.remove("active");

                }

            });

        }

        // Export Markdown Button

        const exportMD = document.getElementById("exportMarkdown");

        if (exportMD) {

            exportMD.addEventListener("click", () => {

                if (State.selectedComponents.length === 0) {

                    alert("Please select components before exporting.");

                    return;

                }

                const mergedReport = State.getMergedReport();

                State.architect.downloadMarkdown("ediccrew-blueprint.md", mergedReport);

            });

        }

        // Export JSON Button

        const exportJSON = document.getElementById("exportJSON");

        if (exportJSON) {

            exportJSON.addEventListener("click", () => {

                if (State.selectedComponents.length === 0) {

                    alert("Please select components before exporting.");

                    return;

                }

                const mergedReport = State.getMergedReport();

                State.architect.downloadJSON("ediccrew-blueprint.json", mergedReport);

            });

        }

    }

}
