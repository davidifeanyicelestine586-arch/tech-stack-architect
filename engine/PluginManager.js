/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Plugin Manager
 * Version: 1.0.0
 * ============================================================
 *
 * Responsibility:
 * - Load external plugins/extensions
 * - Register custom validation rules
 * - Register custom exporters
 *
 */

export default class PluginManager {

    constructor() {

        this.plugins = [];

        this.rules = [];

        this.exporters = {};

    }

    registerPlugin(plugin) {

        this.plugins.push(plugin);

        if (plugin.rules) {

            this.rules.push(...plugin.rules);

        }

        if (plugin.exporters) {

            Object.assign(this.exporters, plugin.exporters);

        }

    }

    getRules() {

        return this.rules;

    }

    getExporter(name) {

        return this.exporters[name] || null;

    }

}
