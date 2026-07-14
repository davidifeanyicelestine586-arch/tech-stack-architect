/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Core Engine
 * Version: 1.0.0
 * ============================================================
 *
 * This is the ONLY class the UI should use.
 *
 */

import DependencyEngine from "./dependencyEngine.js";
import ConflictEngine from "./conflictEngine.js";
import Validator from "./validator.js";
import RecipeEngine from "./recipeEngine.js";
import Exporter from "./exporter.js";
import PluginManager from "./PluginManager.js";

export default class TechStackArchitect {

    constructor(config = {}) {

        this.domains =
            config.domains || [];

        this.components =
            config.components || [];

        this.recipes =
            config.recipes || [];

        this.dependency =
            new DependencyEngine(
                this.components
            );

        this.conflicts =
            new ConflictEngine(
                this.components
            );

        this.validator =
            new Validator(
                this.components
            );

        this.recipesEngine =
            new RecipeEngine(
                this.recipes,
                this.components
            );

        this.exporter =
            new Exporter();

        this.pluginManager =
            new PluginManager();

    }

    /**
     * ------------------------------
     * Domains
     * ------------------------------
     */

    getDomains() {

        return this.domains;

    }

    /**
     * ------------------------------
     * Components
     * ------------------------------
     */

    getComponents() {

        return this.components;

    }

    getComponentsByDomain(domain) {

        return this.components.filter(

            component =>

                component.domain === domain

        );

    }

    /**
     * ------------------------------
     * Recipes
     * ------------------------------
     */

    getRecipes() {

        return this.recipes;

    }

    getRecipe(id) {

        return this.recipesEngine.getRecipe(id);

    }

    recommendRecipes(selected) {

        return this.recipesEngine.recommend(selected);

    }

    /**
     * ------------------------------
     * Validation
     * ------------------------------
     */

    validate(selected) {

        return this.validator.validate(selected);

    }

    /**
     * ------------------------------
     * Build Project
     * ------------------------------
     */

    build({

        recipe = null,

        selectedComponents = []

    }) {

        let blueprint = null;

        if (recipe) {

            blueprint =

                this.recipesEngine.generateBlueprint(

                    recipe

                );

        }

        const report =

            this.validator.validate(

                selectedComponents

            );

        return {

            blueprint,

            report

        };

    }

    /**
     * ------------------------------
     * Export
     * ------------------------------
     */

    exportJSON(report) {

        return this.exporter.exportJSON(report);

    }

    exportMarkdown(report) {

        return this.exporter.exportMarkdown(report);

    }

    downloadJSON(filename, report) {

        this.exporter.downloadJSON(

            filename,

            report

        );

    }

    downloadMarkdown(filename, report) {

        this.exporter.downloadMarkdown(

            filename,

            report

        );

    }

    /**
     * ------------------------------
     * Plugins
     * ------------------------------
     */

    registerPlugin(plugin) {

        this.pluginManager.registerPlugin(plugin);

    }

    getPlugins() {

        return this.pluginManager.plugins;

    }

}