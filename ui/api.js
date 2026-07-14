/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * API Data Loader
 * Version: 1.0.0
 * ============================================================
 */

export default class API {

    static async load() {

        const componentsResponse = await fetch("../data/components.json");

        const domainsResponse = await fetch("../data/domain.json");

        const recipesResponse = await fetch("../data/recipes.json");

        const components = await componentsResponse.json();

        const domains = await domainsResponse.json();

        const recipes = await recipesResponse.json();

        return {

            components,

            domains,

            recipes

        };

    }

}
