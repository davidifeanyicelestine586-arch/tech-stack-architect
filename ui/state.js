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

        this.validate();

    }

    selectComponents(ids) {

        this.selectedComponents = [...new Set(ids)];

        this.validate();

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

        const result = this.architect.build({

            recipe: recipeId,

            selectedComponents: this.selectedComponents

        });

        this.blueprint = result.blueprint;

        this.report = result.report;

        if (this.blueprint) {

            // Autoselect recipe components

            const recipeCompIds = this.blueprint.components.map(c => c.id);

            this.selectedComponents = [...new Set([...this.selectedComponents, ...recipeCompIds])];

            this.validate();

        }

    }

    setDomain(domainId) {

        this.activeDomain = domainId;

    }

    setSearch(query) {

        this.searchQuery = (query || "").toLowerCase();

    }

    getMergedReport() {

        const report = this.report || { score: 100, status: "Good", warnings: [], suggestions: [] };

        const blueprint = this.blueprint || {};

        const selectedComponentObjects = this.selectedComponents.map(id => {

            return this.components.find(c => c.id === id);

        }).filter(Boolean);

        const domainObj = this.domains.find(d => d.id === this.activeDomain);

        const domainTitle = domainObj ? domainObj.title : "Custom Tech Stack";

        return {

            title: blueprint.title || "Custom Stack Blueprint",

            score: report.score,

            status: report.status,

            domain: blueprint.domain || domainTitle,

            components: selectedComponentObjects,

            warnings: report.warnings,

            suggestions: report.suggestions,

            starterCommands: blueprint.starterCommands || []

        };

    }

}

const stateInstance = new State();

export default stateInstance;
