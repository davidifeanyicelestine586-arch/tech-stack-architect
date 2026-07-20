/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * UI Rendering Engine
 * Version: 1.0.0
 * ============================================================
 */

import State from "./state.js";

export default class Renderer {

    static escapeHTML(str) {
        if (typeof str !== "string") return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static render() {

        this.renderComponents();

        this.renderSelectedComponents();

        this.renderValidationReport();

        this.renderRecipes();

        this.renderBlueprint();

    }

    /**
     * --------------------------------------------------------
     * Render Component Grid
     * --------------------------------------------------------
     */
    static renderComponents() {

        const grid = document.getElementById("componentGrid");

        const template = document.getElementById("componentTemplate");

        if (!grid || !template) return;

        grid.innerHTML = "";

        // Filter components
        const filtered = State.components.filter(comp => {

            const matchesDomain = !State.activeDomain || comp.domain === State.activeDomain;

            const query = State.searchQuery;

            const matchesSearch = !query || 

                comp.name.toLowerCase().includes(query) ||

                comp.id.toLowerCase().includes(query) ||

                (comp.category || "").toLowerCase().includes(query) ||

                (comp.tags || []).some(tag => tag.toLowerCase().includes(query)) ||

                (comp.requires || []).some(reqId => {

                    if (reqId.toLowerCase().includes(query)) return true;

                    const reqComp = State.components.find(c => c.id === reqId);

                    return reqComp && reqComp.name.toLowerCase().includes(query);

                }) ||

                (comp.description || "").toLowerCase().includes(query);

            return matchesDomain && matchesSearch;

        });

        if (filtered.length === 0) {

            grid.innerHTML = `<div class="empty-card">No components match your search.</div>`;

            return;

        }

        filtered.forEach(comp => {

            const clone = template.content.cloneNode(true);

            const card = clone.querySelector(".component-card");

            const nameEl = clone.querySelector(".name");

            const diffEl = clone.querySelector(".difficulty");

            const descEl = clone.querySelector(".description");

            const tagsContainer = clone.querySelector(".tags");

            const button = clone.querySelector(".selectButton");

            card.dataset.id = comp.id;

            if (nameEl) nameEl.textContent = comp.name;

            if (diffEl) {
                diffEl.textContent = comp.difficulty || "Beginner";
                diffEl.style.display = "inline-flex";
            }

            if (descEl) descEl.textContent = comp.description || "";

            // Render tags
            if (tagsContainer) {

                tagsContainer.innerHTML = "";

                // Add category as tag
                if (comp.category) {

                    const catTag = document.createElement("span");

                    catTag.className = "tag";

                    catTag.style.background = "rgba(70, 50, 218, 0.08)";

                    catTag.style.color = "var(--primary)";

                    catTag.textContent = comp.category;

                    tagsContainer.appendChild(catTag);

                }

            }

            const isSelected = State.selectedComponents.includes(comp.id);

            if (isSelected) {

                card.classList.add("selected");

                if (button) {

                    button.classList.add("selected");

                    button.textContent = "✓ Selected";

                }

            } else {

                card.classList.remove("selected");

                if (button) {

                    button.classList.remove("selected");

                    button.textContent = "Select";

                }

            }

            card.addEventListener("click", (e) => {

                State.toggleComponent(comp.id);

                this.render();

            });

            grid.appendChild(card);

        });

    }

    /**
     * --------------------------------------------------------
     * Render Selected Chips List
     * --------------------------------------------------------
     */
    static renderSelectedComponents() {

        const container = document.getElementById("selectedComponents");

        // Update mobile floating action button badge
        const badge = document.getElementById("mobileSelectedBadge");

        if (badge) {

            badge.textContent = State.selectedComponents.length;

            badge.style.display = State.selectedComponents.length > 0 ? "flex" : "none";

        }

        if (!container) return;

        if (State.selectedComponents.length === 0) {

            container.innerHTML = `<p>No components selected.</p>`;

            return;

        }

        const listDiv = document.createElement("div");

        listDiv.className = "selected-list";

        State.selectedComponents.forEach(id => {

            const comp = State.components.find(c => c.id === id);

            if (!comp) return;

            const chip = document.createElement("div");

            chip.className = "selected-chip";

            const span = document.createElement("span");

            span.textContent = comp.name;

            const closeBtn = document.createElement("button");

            closeBtn.textContent = "×";

            closeBtn.addEventListener("click", () => {

                State.toggleComponent(id);

                this.render();

            });

            chip.appendChild(span);

            chip.appendChild(closeBtn);

            listDiv.appendChild(chip);

        });

        container.innerHTML = "";

        container.appendChild(listDiv);

    }

    /**
     * --------------------------------------------------------
     * Render Validation Report Panel
     * --------------------------------------------------------
     */
    static renderValidationReport() {

        const panel = document.getElementById("validationPanel");

        if (!panel) return;

        if (State.selectedComponents.length === 0) {

            panel.innerHTML = `<div class="empty-state">Select components to begin.</div>`;

            return;

        }

        const report = State.report;

        if (!report) return;

        // Status class
        let statusClass = "status-info";
        let circleColor = "var(--info)";

        if (report.score >= 90) {
            statusClass = "status-success";
            circleColor = "var(--success)";
        } else if (report.score >= 75) {
            statusClass = "status-info";
            circleColor = "var(--info)";
        } else if (report.score >= 60) {
            statusClass = "status-warning";
            circleColor = "var(--warning)";
        } else {
            statusClass = "status-danger";
            circleColor = "var(--danger)";
        }

        // Build report UI
        let html = `

            <div class="score-wrapper">

                <div class="score-circle" style="border-color: ${circleColor}; color: ${circleColor}">

                    ${report.score}

                </div>

                <div class="score-details">

                    <span class="status-badge ${statusClass}">${report.status}</span>

                    <p style="font-size: var(--text-sm); margin-top: 4px;">

                        ${report.valid ? "✓ Configuration is viable." : (report.conflictReport?.hasConflicts ? "❌ Configuration has critical conflicts." : "⚠️ Configuration is incomplete or has warnings.")}

                    </p>

                </div>

            </div>

            <div class="divider"></div>

            <div class="validation-list">

        `;

        let itemsCount = 0;

        // Conflicts
        if (report.conflictReport && report.conflictReport.componentConflicts.length > 0) {

            report.conflictReport.componentConflicts.forEach(c => {

                itemsCount++;

                const srcName = this.escapeHTML(State.components.find(comp => comp.id === c.source)?.name || c.source);

                const trgName = this.escapeHTML(State.components.find(comp => comp.id === c.target)?.name || c.target);

                const reason = this.escapeHTML(c.reason);

                html += `

                    <div class="validation-item" style="border-left: 4px solid var(--danger);">

                        <span class="validation-icon">❌</span>

                        <div class="validation-content">

                            <div class="validation-title">Incompatible Stack</div>

                            <div class="validation-message"><strong>${srcName}</strong> is incompatible with <strong>${trgName}</strong>: ${reason}</div>

                        </div>

                    </div>

                `;

            });

        }

        // Pin Conflicts
        if (report.conflictReport && report.conflictReport.pinConflicts.length > 0) {

            report.conflictReport.pinConflicts.forEach(p => {

                itemsCount++;

                const pin = this.escapeHTML(String(p.pin));

                const components = this.escapeHTML(p.components.join(", "));

                const recommendation = this.escapeHTML(p.recommendation);

                html += `

                    <div class="validation-item" style="border-left: 4px solid var(--danger);">

                        <span class="validation-icon">❌</span>

                        <div class="validation-content">

                            <div class="validation-title">Hardware Pin Conflict</div>

                            <div class="validation-message">Pin <strong>${pin}</strong> is requested by multiple components: ${components}. Recommendation: ${recommendation}</div>

                        </div>

                    </div>

                `;

            });

        }

        // Rule Violations
        if (report.conflictReport && report.conflictReport.ruleViolations && report.conflictReport.ruleViolations.length > 0) {

            report.conflictReport.ruleViolations.forEach(r => {

                itemsCount++;

                const rule = this.escapeHTML(r.rule);

                const message = this.escapeHTML(r.message);

                html += `

                    <div class="validation-item" style="border-left: 4px solid var(--danger);">

                        <span class="validation-icon">❌</span>

                        <div class="validation-content">

                            <div class="validation-title">Rule Violation: ${rule}</div>

                            <div class="validation-message">${message}</div>

                        </div>

                    </div>

                `;

            });

        }

        // Missing Dependencies
        if (report.dependencyReport && report.dependencyReport.missing.length > 0) {

            report.dependencyReport.missing.forEach(depId => {

                itemsCount++;

                const depName = this.escapeHTML(State.components.find(comp => comp.id === depId)?.name || depId);

                html += `

                    <div class="validation-item" style="border-left: 4px solid var(--warning);">

                        <span class="validation-icon">⚠️</span>

                        <div class="validation-content">

                            <div class="validation-title">Missing Dependency</div>

                            <div class="validation-message">One or more selected components require <strong>${depName}</strong>. Please select it to resolve the issue.</div>

                        </div>

                    </div>

                `;

            });

        }

        // Warnings
        if (report.warnings && report.warnings.length > 0) {

            report.warnings.forEach(w => {

                itemsCount++;

                const component = this.escapeHTML(w.component);

                const message = this.escapeHTML(w.message);

                html += `

                    <div class="validation-item" style="border-left: 4px solid var(--warning);">

                        <span class="validation-icon">⚠️</span>

                        <div class="validation-content">

                            <div class="validation-title">Advisory Warning (${component})</div>

                            <div class="validation-message">${message}</div>

                        </div>

                    </div>

                `;

            });

        }

        // Suggestions
        if (report.suggestions && report.suggestions.length > 0) {

            report.suggestions.forEach(s => {

                // Filter out already listed missing dependencies or duplicate recommendations

                if (s.includes("conflict") || s.includes("pin")) return; // already shown above

                itemsCount++;

                const suggestion = this.escapeHTML(s);

                html += `

                    <div class="validation-item" style="border-left: 4px solid var(--info);">

                        <span class="validation-icon">💡</span>

                        <div class="validation-content">

                            <div class="validation-title">Actionable Recommendation</div>

                            <div class="validation-message">${suggestion}</div>

                        </div>

                    </div>

                `;

            });

        }

        if (itemsCount === 0) {

            html += `

                <div class="empty-state" style="min-height: 80px; border-style: solid; border-color: var(--success); background: rgba(16, 185, 129, 0.05); color: var(--success)">

                    ✓ Stack looks perfect! No warnings or conflicts.

                </div>

            `;

        }

        html += `</div>`;

        panel.innerHTML = html;

    }

    /**
     * --------------------------------------------------------
     * Render Recipe Panel
     * --------------------------------------------------------
     */
    static renderRecipes() {

        const panel = document.getElementById("recipePanel");

        if (!panel) return;

        panel.innerHTML = "";

        let recommendations = State.architect.recommendRecipes(State.selectedComponents);

        if (State.activeDomain) {
            recommendations = recommendations.filter(rec => rec.recipe.domain === State.activeDomain);
        }

        if (recommendations.length === 0) {

            panel.innerHTML = `<div class="empty-state">No recipes registered for this domain.</div>`;

            return;

        }

        const gridDiv = document.createElement("div");

        gridDiv.className = "component-grid";

        recommendations.forEach(rec => {

            const recipe = rec.recipe;

            const score = rec.score;

            const card = document.createElement("div");

            card.className = "recipe-card";

            card.style.minHeight = "180px";

            // Title
            const titleEl = document.createElement("h3");

            titleEl.className = "title";

            titleEl.textContent = recipe.title;

            // Match score and meter
            const matchEl = document.createElement("p");

            matchEl.className = "match";

            matchEl.textContent = `Match Score: ${score}%`;

            const meterBg = document.createElement("div");

            meterBg.className = "match-bar";

            const meterFill = document.createElement("div");

            meterFill.className = "match-fill";

            meterFill.style.width = `${score}%`;

            meterBg.appendChild(meterFill);

            // Description
            const descEl = document.createElement("p");

            descEl.className = "description";

            descEl.textContent = recipe.description || "";

            descEl.style.fontSize = "var(--text-sm)";

            // Button
            const button = document.createElement("button");

            button.className = "recipeButton";

            button.textContent = "Generate Blueprint";

            button.addEventListener("click", () => {

                State.generateBlueprint(recipe.id);

                this.render();

                // Scroll to blueprint

                document.getElementById("blueprintPanel")?.scrollIntoView({ behavior: "smooth" });

            });

            card.appendChild(titleEl);

            card.appendChild(matchEl);

            card.appendChild(meterBg);

            card.appendChild(descEl);

            card.appendChild(button);

            gridDiv.appendChild(card);

        });

        panel.appendChild(gridDiv);

    }

    /**
     * --------------------------------------------------------
     * Render Blueprint Panel
     * --------------------------------------------------------
     */
    static renderBlueprint() {

        const panel = document.getElementById("blueprintPanel");

        if (!panel) return;

        if (!State.blueprint) {

            panel.innerHTML = `<div class="empty-state">No blueprint generated. Choose a recipe above to build one.</div>`;

            return;

        }

        const bp = State.blueprint;

        const title = this.escapeHTML(bp.title);

        const description = this.escapeHTML(bp.description);

        const difficulty = this.escapeHTML(bp.difficulty);

        const hours = this.escapeHTML(String(bp.estimatedHours));

        let html = `

            <div class="blueprint-section">

                <h2 style="color: var(--primary); margin-bottom: var(--space-2)">${title}</h2>

                <p style="margin-bottom: var(--space-4); font-size: var(--text-md)">${description}</p>

                

                <div class="info-grid" style="margin-bottom: var(--space-5)">

                    <div class="info-card">

                        <h4>Domain</h4>

                        <strong>${bp.domain === "web-saas" ? "Web & SaaS" : bp.domain === "ai-automation" ? "AI Automation" : "Mechatronics"}</strong>

                    </div>

                    <div class="info-card">

                        <h4>Difficulty</h4>

                        <strong style="color: var(--primary)">${difficulty}</strong>

                    </div>

                    <div class="info-card">

                        <h4>Est. Development</h4>

                        <strong>${hours} Hours</strong>

                    </div>

                </div>

            </div>

            <div class="divider"></div>

            <div class="blueprint-section">

                <h3>Components Stack</h3>

                <div class="selected-list" style="margin-bottom: var(--space-4)">

        `;

        bp.components.forEach(comp => {

            const name = this.escapeHTML(comp.name);

            html += `

                <span class="selected-chip" style="background: var(--surface); color: var(--text); border: 1px solid var(--border)">

                    ${name}

                </span>

            `;

        });

        html += `

                </div>

            </div>

        `;

        // Render Recommended Additions if present
        if (bp.recommended && bp.recommended.length > 0) {

            html += `

                <div class="blueprint-section">

                    <h3>Recommended Additions</h3>

                    <div class="selected-list" style="margin-bottom: var(--space-4)">

            `;

            bp.recommended.forEach(recId => {

                const comp = State.components.find(c => c.id === recId);

                const name = comp ? comp.name : recId;

                const escapedName = this.escapeHTML(name);

                const isSelected = State.selectedComponents.includes(recId);

                if (isSelected) {

                    html += `

                        <span class="selected-chip" style="background: var(--surface); color: var(--text-secondary); border: 1px solid var(--border); opacity: 0.6;">

                            ✓ ${escapedName}

                        </span>

                    `;

                } else {

                    html += `

                        <button class="selected-chip recommended-add-chip" data-id="${recId}" style="background: rgba(70, 50, 218, 0.05); color: var(--primary); border: 1px dashed var(--primary); cursor: pointer; transition: background 0.2s;">

                            + ${escapedName}

                        </button>

                    `;

                }

            });

            html += `

                    </div>

                </div>

            `;

        }

        html += `

            <div class="blueprint-section">

                <h3>Learning Goals</h3>

                <ul style="list-style-type: disc; padding-left: var(--space-5); margin-bottom: var(--space-4)">

        `;

        (bp.learningGoals || []).forEach(goal => {

            const escapedGoal = this.escapeHTML(goal);

            html += `<li style="margin-bottom: 4px; color: var(--text-secondary);">${escapedGoal}</li>`;

        });

        html += `

                </ul>

            </div>

            <div class="blueprint-section">

                <h3>Expected Deliverables</h3>

                <div class="tags" style="margin-top: 0; margin-bottom: var(--space-4)">

        `;

        (bp.outputs || []).forEach(output => {

            const escapedOutput = this.escapeHTML(output);

            html += `<span class="tag" style="background: rgba(6, 217, 250, 0.1); color: var(--secondary-dark); padding: 6px 12px;">${escapedOutput}</span>`;

        });

        html += `

                </div>

            </div>

        `;

        if (bp.starterCommands && bp.starterCommands.length > 0) {

            const escapedCommands = bp.starterCommands.map(cmd => this.escapeHTML(cmd)).join("\n");

            html += `

                <div class="blueprint-section">

                    <h3>Starter Commands</h3>

                    <pre class="blueprint-code"><code>${escapedCommands}</code></pre>

                </div>

            `;

        }

        if (bp.warnings && bp.warnings.length > 0) {

            html += `

                <div class="blueprint-section" style="margin-top: var(--space-4)">

                    <h3 style="color: var(--warning)">Advisory Warnings</h3>

                    <ul style="list-style-type: none; padding-left: 0;">

            `;

            bp.warnings.forEach(w => {

                const warning = this.escapeHTML(w);

                html += `

                    <li style="padding: 10px; background: rgba(245, 158, 11, 0.08); border-radius: var(--radius); border-left: 4px solid var(--warning); margin-bottom: var(--space-2); color: var(--text);">

                        ⚠️ ${warning}

                    </li>

                `;

            });

            html += `

                    </ul>

                </div>

            `;

        }

        panel.innerHTML = html;

        // Attach listeners for recommended add button clicks
        panel.querySelectorAll(".recommended-add-chip").forEach(btn => {

            btn.addEventListener("click", (e) => {

                e.stopPropagation();

                const compId = btn.dataset.id;

                State.toggleComponent(compId);

                this.render();

            });

        });

    }

}
