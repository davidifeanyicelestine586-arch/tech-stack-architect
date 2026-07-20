/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Conflict Detection Engine
 * Version: 1.0.0
 * ============================================================
 *
 * Responsibilities
 * ----------------
 * ✓ Duplicate component detection
 * ✓ Component incompatibilities
 * ✓ Hardware pin conflicts
 * ✓ Future rule engine support
 *
 */

export default class ConflictEngine {

    constructor(components = []) {

        this.components = components;

        this.index = {};

        components.forEach(component => {

            this.index[component.id] = component;

        });

    }

    addComponents(newComponents) {
        newComponents.forEach(component => {
            if (!this.index[component.id]) {
                this.components.push(component);
                this.index[component.id] = component;
            }
        });
    }

    /**
     * ----------------------------------------
     * Lookup Component
     * ----------------------------------------
     */
    getComponent(id) {

        return this.index[id] || null;

    }

    /**
     * ----------------------------------------
     * Duplicate Selection Detection
     * ----------------------------------------
     */
    findDuplicates(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const seen = new Set();
        const duplicates = [];

        selectedIds.forEach(id => {

            if (seen.has(id)) {

                duplicates.push(id);

            } else {

                seen.add(id);

            }

        });

        return duplicates;

    }

    /**
     * ----------------------------------------
     * Component Conflicts
     * ----------------------------------------
     */
    findComponentConflicts(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const conflicts = [];
        const seenPairs = new Set();

        selectedIds.forEach(id => {

            const component = this.getComponent(id);

            if (!component) return;

            (component.conflicts || []).forEach(conflict => {

                const target =
                    typeof conflict === "string"
                        ? conflict
                        : conflict.component;

                if (selectedIds.includes(target)) {

                    const pairKey = [id, target].sort().join("::");

                    if (!seenPairs.has(pairKey)) {

                        seenPairs.add(pairKey);

                        conflicts.push({

                            source: id,

                            target,

                            reason:
                                conflict.reason ||
                                "Components are incompatible."

                        });

                    }

                }

            });

        });

        return conflicts;

    }

    /**
     * ----------------------------------------
     * Hardware Pin Conflicts
     * ----------------------------------------
     */
    findPinConflicts(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const pinMap = {};

        const issues = [];

        selectedIds.forEach(id => {

            const component = this.getComponent(id);

            if (!component) return;

            const pins = component.pinsRequired || [];

            pins.forEach(pin => {

                if (!pinMap[pin]) {

                    pinMap[pin] = [];

                }

                pinMap[pin].push(component.name);

            });

        });

        Object.entries(pinMap).forEach(([pin, users]) => {

            if (users.length > 1) {

                issues.push({

                    pin,

                    components: users,

                    severity: "high",

                    recommendation:
                        "Reassign one of the components to another compatible pin."

                });

            }

        });

        return issues;

    }

    /**
     * ----------------------------------------
     * Reserved For Future
     * ----------------------------------------
     *
     * Future Examples:
     *
     * - SQLite + Enterprise Mode
     * - MCP without Token Vault
     * - Cloudflare + Unsupported Runtime
     * - ESP32 Voltage Rules
     *
     */

    findRuleViolations(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const violations = [];

        // Rule 1: SQLite + NextJS + MCP Server (Enterprise/Concurrent Workflows)
        if (selectedIds.includes("sqlite") && selectedIds.includes("nextjs") && selectedIds.includes("mcp-server")) {

            violations.push({

                rule: "SQLite High Concurrency Limit",

                severity: "medium",

                message: "SQLite is not recommended for highly concurrent enterprise SaaS architectures with Next.js and MCP servers."

            });

        }

        // Rule 2: MCP Server without Token Vault
        if (selectedIds.includes("mcp-server") && !selectedIds.includes("secure-token-vault")) {

            violations.push({

                rule: "Insecure Token Storage",

                severity: "high",

                message: "Running Model Context Protocol (MCP) servers without a Secure Token Vault exposes API credentials."

            });

        }

        // Rule 3: Local Runtime / Cloud Hosting Incompatibility
        if (selectedIds.includes("pydroid3") && selectedIds.includes("vercel")) {

            violations.push({

                rule: "Runtime Hosting Mismatch",

                severity: "high",

                message: "Local Android python execution (Pydroid 3) is incompatible with cloud-native Vercel hosting."

            });

        }

        // Rule 4: Mechatronics Power safety rule
        if (selectedIds.includes("arduino-uno") && selectedIds.includes("l298n") && !selectedIds.includes("external-power-supply")) {

            violations.push({

                rule: "Insufficient Motor Power Supply",

                severity: "high",

                message: "The Arduino Uno digital output pins cannot supply the current required to drive DC motors via the L298N Motor Driver. An External Power Supply is required."

            });

        }

        return violations;

    }

    /**
     * ----------------------------------------
     * Full Analysis
     * ----------------------------------------
     */

    analyze(selectedIds = []) {

        if (!Array.isArray(selectedIds)) selectedIds = [];

        const duplicateSelections =
            this.findDuplicates(selectedIds);

        const componentConflicts =
            this.findComponentConflicts(selectedIds);

        const pinConflicts =
            this.findPinConflicts(selectedIds);

        const ruleViolations =
            this.findRuleViolations(selectedIds);

        return {

            hasConflicts:

                duplicateSelections.length > 0 ||

                componentConflicts.length > 0 ||

                pinConflicts.length > 0 ||

                ruleViolations.length > 0,

            duplicates: duplicateSelections,

            componentConflicts,

            pinConflicts,

            ruleViolations

        };

    }

}