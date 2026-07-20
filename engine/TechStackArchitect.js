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

import Validator from "./Validator.js";
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



        this.pluginManager =
            new PluginManager();

        this.validator =
            new Validator(
                this.components,
                this.pluginManager
            );

        this.recipesEngine =
            new RecipeEngine(
                this.recipes,
                this.components
            );

        this.exporter =
            new Exporter();

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

    export(format, report) {

        const customExporter = this.pluginManager.getExporter(format);

        if (customExporter) {

            return customExporter(report);

        }

        if (format.toLowerCase() === "json") return this.exportJSON(report);

        if (format.toLowerCase() === "markdown" || format.toLowerCase() === "md") return this.exportMarkdown(report);

        throw new Error(`Unsupported export format: ${format}`);

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

    download(format, filename, report) {

        const customExporter = this.pluginManager.getExporter(format);

        if (customExporter) {

            const content = customExporter(report);

            let contentString = content;

            let mimeType = "text/plain";

            if (content && typeof content === "object") {

                contentString = content.content;

                mimeType = content.mimeType || "text/plain";

            }

            this.exporter.download(filename, contentString, mimeType);

            return;

        }

        if (format.toLowerCase() === "json") return this.downloadJSON(filename, report);

        if (format.toLowerCase() === "markdown" || format.toLowerCase() === "md") return this.downloadMarkdown(filename, report);

        throw new Error(`Unsupported download format: ${format}`);

    }

    /**
     * ------------------------------
     * Plugins
     * ------------------------------
     */

    registerPlugin(plugin) {

        this.pluginManager.registerPlugin(plugin);

        if (plugin.components && Array.isArray(plugin.components)) {

            this.components.push(...plugin.components);

            this.validator.addComponents(plugin.components);

            this.recipesEngine.addComponents(plugin.components);

        }

        if (plugin.recipes && Array.isArray(plugin.recipes)) {

            this.recipes.push(...plugin.recipes);

            this.recipesEngine.addRecipes(plugin.recipes);

        }

    }

    getPlugins() {

        return this.pluginManager.plugins;

    }

}