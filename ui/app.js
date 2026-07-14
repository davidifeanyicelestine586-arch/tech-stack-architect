/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Application Bootstrap
 * Version 1.0.0
 * ============================================================
 */

import State from "./state.js";
import API from "./api.js";
import Renderer from "./renderer.js";
import Events from "./events.js";
import ArchitectUI from "./architectUI.js";

class App {

    async start() {

        console.log("Starting Ediccrew Tech Stack Architect...");

        // Load data
        const data = await API.load();

        // Initialize state
        State.initialize(data);

        // Initialize Architect
        ArchitectUI.initialize(data);

        // Initial Render
        Renderer.render();

        // Attach Events
        Events.initialize();

        console.log("Application Ready");

    }

}

const app = new App();

app.start();