/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * UI Initialization Engine
 * Version: 1.0.0
 * ============================================================
 */

import State from "./state.js";

import Renderer from "./renderer.js";

export default class ArchitectUI {

    static initialize(data) {

        const domainList = document.getElementById("domainList");

        const template = document.getElementById("domainTemplate");

        if (!domainList || !template) return;

        domainList.innerHTML = "";

        data.domains.forEach(domain => {

            const clone = template.content.cloneNode(true);

            const card = clone.querySelector(".domain-card");

            card.dataset.id = domain.id;

            const iconSpan = card.querySelector(".icon");

            const titleSpan = card.querySelector(".title");

            if (iconSpan) iconSpan.textContent = domain.icon || "📦";

            if (titleSpan) titleSpan.textContent = domain.shortTitle || domain.title;

            card.addEventListener("click", () => {

                State.setDomain(domain.id);

                document.querySelectorAll(".domain-card").forEach(c => {

                    c.classList.toggle("active", c.dataset.id === domain.id);

                });

                Renderer.render();

            });

            if (domain.id === State.activeDomain) {

                card.classList.add("active");

            }

            domainList.appendChild(card);

        });

    }

}
