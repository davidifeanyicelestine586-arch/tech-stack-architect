/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * State Management Engine
 * Version: 1.0.0
 * ============================================================
 */

import TechStackArchitect from "../engine/TechStackArchitect.js";

class State {

    constructor() {

        this.selectedComponents = [];

        this.activeDomain = null;

        this.searchQuery = "";

        this.blueprint = null;

        this.report = null;

        this.components = [];

        this.domains = [];

        this.recipes = [];

        this.architect = null;

    }

    initialize(data) {

        this.components = data.components || [];

        this.domains = data.domains || [];

        this.recipes = data.recipes || [];

        this.architect = new TechStackArchitect({

            components: this.components,

            domains: this.domains,

            recipes: this.recipes

        });

        if (this.domains.length > 0) {

            this.activeDomain = this.domains[0].id;

        }

        this.validate();

    }

    toggleComponent(id) {

        const index = this.selectedComponents.indexOf(id);

        if (index === -1) {

            this.selectedComponents.push(id);

        } else {

            this.selectedComponents.splice(index, 1);

        }

        if (this.blueprint) {
            if (this.blueprint.id === "custom-blueprint") {
                this.generateCustomBlueprint();
            } else {
                this.generateBlueprint(this.blueprint.id);
            }
        } else {
            this.validate();
        }

    }

    selectComponents(ids) {

        this.selectedComponents = [...new Set(ids)];

        if (this.blueprint) {
            if (this.blueprint.id === "custom-blueprint") {
                this.generateCustomBlueprint();
            } else {
                this.generateBlueprint(this.blueprint.id);
            }
        } else {
            this.validate();
        }

    }

    clearSelection() {

        this.selectedComponents = [];

        this.blueprint = null;

        this.report = null;

        this.validate();

    }

    validate() {

        if (this.architect) {

            this.report = this.architect.validate(this.selectedComponents);

        }

    }

    generateBlueprint(recipeId) {

        if (!this.architect) return;

        const recipe = this.recipes.find(r => r.id === recipeId);

        if (recipe) {

            // Autoselect recipe components first

            this.selectedComponents = [...new Set([...this.selectedComponents, ...(recipe.components || [])])];

        }

        const result = this.architect.build({

            recipe: recipeId,

            selectedComponents: this.selectedComponents

        });

        this.blueprint = result.blueprint;

        this.report = result.report;

    }

    generateCustomBlueprint() {

        if (!this.architect) return;

        const selectedObjects = this.selectedComponents
            .map(id => this.components.find(c => c.id === id))
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

        this.validate();

        this.blueprint = {
            id: "custom-blueprint",
            title: "Custom Tech Stack Blueprint",
            description: `A custom designed technology architecture comprising ${selectedObjects.length} components.`,
            domain: this.activeDomain || "web-saas",
            difficulty: customDifficulty,
            estimatedHours: totalHours || 8,
            components: selectedObjects,
            learningGoals: allLearningGoals.length > 0 ? allLearningGoals : ["Build custom integrations"],
            outputs: allOutputs.length > 0 ? allOutputs : ["architecture", "starter-code"],
            starterCommands: commands,
            warnings: this.report?.warnings?.map(w => w.message) || []
        };

    }

    setDomain(domainId) {

        this.activeDomain = domainId;

    }

    setSearch(query) {

        this.searchQuery = (query || "").toLowerCase();

    }

    getMergedReport() {

        if (!this.blueprint && this.selectedComponents.length > 0) {
            this.generateCustomBlueprint();
        }

        const report = this.report || { score: 100, status: "Good", warnings: [], suggestions: [] };

        const blueprint = this.blueprint || {};

        const selectedComponentObjects = this.selectedComponents.map(id => {

            return this.components.find(c => c.id === id);

        }).filter(Boolean);

        const domainObj = this.domains.find(d => d.id === this.activeDomain);

        const domainTitle = domainObj ? domainObj.title : "Custom Tech Stack";

        // Combine component warnings and blueprint warnings without duplicating
        const combinedWarnings = [...(report.warnings || [])];
        if (blueprint.warnings && Array.isArray(blueprint.warnings)) {
            blueprint.warnings.forEach(w => {
                const msg = typeof w === "string" ? w : w.message;
                if (!combinedWarnings.some(cw => (cw.message || cw) === msg)) {
                    combinedWarnings.push(typeof w === "string" ? { component: "Recipe/Blueprint", severity: "warning", message: w } : w);
                }
            });
        }

        return {

            title: blueprint.title || "Custom Stack Blueprint",

            score: report.score,

            status: report.status,

            domain: blueprint.domain || domainTitle,

            components: selectedComponentObjects,

            warnings: combinedWarnings,

            suggestions: report.suggestions,

            starterCommands: blueprint.starterCommands || [],

            learningGoals: blueprint.learningGoals || [],

            outputs: blueprint.outputs || []

        };

    }

}

const stateInstance = new State();

export default stateInstance;
