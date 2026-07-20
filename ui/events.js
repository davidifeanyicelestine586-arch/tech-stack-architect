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

            const debounce = (func, delay) => {
                let timer;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => func(...args), delay);
                };
            };

            const debouncedRender = debounce((val) => {
                State.setSearch(val);
                Renderer.render();
            }, 250);

            searchInput.addEventListener("input", (e) => {

                debouncedRender(e.target.value);

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

                State.generateCustomBlueprint();

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
