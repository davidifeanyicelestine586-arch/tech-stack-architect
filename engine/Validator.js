/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Validation Engine
 * Version: 1.0.0
 * ============================================================
 *
 * Master validator.
 *
 * Responsibilities
 * ----------------
 * ✓ Run Dependency Engine
 * ✓ Run Conflict Engine
 * ✓ Collect Warnings
 * ✓ Calculate Score
 * ✓ Determine Build Status
 *
 */

import DependencyEngine from "./dependencyEngine.js";
import ConflictEngine from "./conflictEngine.js";

export default class Validator {

    constructor(components = []) {

        this.components = components;

        this.dependencyEngine = new DependencyEngine(components);

        this.conflictEngine = new ConflictEngine(components);

        this.index = {};

        components.forEach(component => {

            this.index[component.id] = component;

        });

    }

    /**
     * ---------------------------------------
     * Component Lookup
     * ---------------------------------------
     */

    getComponent(id) {

        return this.index[id] || null;

    }

    /**
     * ---------------------------------------
     * Collect Component Warnings
     * ---------------------------------------
     */

    collectWarnings(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const warnings = [];

        selectedIds.forEach(id => {

            const component = this.getComponent(id);

            if (!component) return;

            (component.warnings || []).forEach(message => {

                warnings.push({

                    component: component.name,

                    severity: "warning",

                    message

                });

            });

        });

        return warnings;

    }

    /**
     * ---------------------------------------
     * Domain Summary
     * ---------------------------------------
     */

    summarizeDomains(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const domains = {};

        selectedIds.forEach(id => {

            const component = this.getComponent(id);

            if (!component) return;

            domains[component.domain] =
                (domains[component.domain] || 0) + 1;

        });

        return domains;

    }

    /**
     * ---------------------------------------
     * Compatibility Score
     * ---------------------------------------
     */

    calculateScore(dependencyReport, conflictReport) {

        let score = 100;

        score -= dependencyReport.missing.length * 10;

        score -= conflictReport.componentConflicts.length * 20;

        score -= conflictReport.pinConflicts.length * 25;

        score -= conflictReport.duplicates.length * 10;

        score -= conflictReport.ruleViolations.length * 15;

        return Math.max(score, 0);

    }

    /**
     * ---------------------------------------
     * Build Status
     * ---------------------------------------
     */

    determineStatus(score) {

        if (score >= 90)
            return "Production Ready";

        if (score >= 75)
            return "Good";

        if (score >= 60)
            return "Needs Review";

        if (score >= 40)
            return "High Risk";

        return "Invalid Configuration";

    }

    /**
     * ---------------------------------------
     * Suggestions
     * ---------------------------------------
     */

    generateSuggestions(dependencyReport, conflictReport) {

        const suggestions = [];

        dependencyReport.missing.forEach(dep => {

            suggestions.push(

                `Install or configure "${dep}".`

            );

        });

        conflictReport.componentConflicts.forEach(conflict => {

            suggestions.push(

                `${conflict.source} conflicts with ${conflict.target}.`

            );

        });

        conflictReport.pinConflicts.forEach(pin => {

            suggestions.push(

                `Resolve pin ${pin.pin} assignment.`

            );

        });

        return suggestions;

    }

    /**
     * ---------------------------------------
     * Validate
     * ---------------------------------------
     */

    validate(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const dependencyReport =
            this.dependencyEngine.analyze(selectedIds);

        const conflictReport =
            this.conflictEngine.analyze(selectedIds);

        const warnings =
            this.collectWarnings(selectedIds);

        const score =
            this.calculateScore(
                dependencyReport,
                conflictReport
            );

        const status =
            this.determineStatus(score);

        const suggestions =
            this.generateSuggestions(
                dependencyReport,
                conflictReport
            );

        return {

            valid:

                score >= 60 &&

                !conflictReport.hasConflicts,

            score,

            status,

            domains:
                this.summarizeDomains(selectedIds),

            dependencyReport,

            conflictReport,

            warnings,

            suggestions,

            timestamp:
                new Date().toISOString()

        };

    }

}