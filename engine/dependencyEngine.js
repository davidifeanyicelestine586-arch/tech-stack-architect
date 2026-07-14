/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Dependency Resolution Engine
 * Version: 1.0.0
 * ============================================================
 *
 * Responsibility:
 * - Resolve required dependencies
 * - Resolve optional dependencies
 * - Detect missing requirements
 *
 * This engine DOES NOT validate conflicts.
 * Conflict detection belongs to conflictEngine.js
 *
 */

export default class DependencyEngine {

    constructor(components = []) {

        /**
         * Component database
         */
        this.components = components;

        /**
         * Fast lookup table
         */
        this.index = {};

        components.forEach(component => {
            this.index[component.id] = component;
        });

    }

    /**
     * ----------------------------------------
     * Find Component
     * ----------------------------------------
     */
    getComponent(id) {

        return this.index[id] || null;

    }

    /**
     * ----------------------------------------
     * Get Required Dependencies
     * ----------------------------------------
     */
    getRequiredDependencies(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const required = new Set();

        selectedIds.forEach(id => {

            const component = this.getComponent(id);

            if (!component) return;

            (component.requires || []).forEach(dep => {

                required.add(dep);

            });

        });

        return [...required];

    }

    /**
     * ----------------------------------------
     * Get Optional Dependencies
     * ----------------------------------------
     */
    getOptionalDependencies(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const optional = new Set();

        selectedIds.forEach(id => {

            const component = this.getComponent(id);

            if (!component) return;

            (component.optional || []).forEach(dep => {

                optional.add(dep);

            });

        });

        return [...optional];

    }

    /**
     * ----------------------------------------
     * Missing Dependencies
     * ----------------------------------------
     *
     * Example:
     *
     * Selected:
     * nextjs
     *
     * Requires:
     * nodejs
     * vercel
     *
     * If nodejs and vercel
     * aren't selected,
     * they become "missing".
     *
     */
    getMissingDependencies(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const required = this.getRequiredDependencies(selectedIds);

        return required.filter(dep => !selectedIds.includes(dep));

    }

    /**
     * ----------------------------------------
     * Full Dependency Report
     * ----------------------------------------
     */
    analyze(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        return {

            selected: [...selectedIds],

            required: this.getRequiredDependencies(selectedIds),

            optional: this.getOptionalDependencies(selectedIds),

            missing: this.getMissingDependencies(selectedIds)

        };

    }

}