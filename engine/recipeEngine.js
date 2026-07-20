/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * Recipe Engine
 * Version: 1.0.0
 * ============================================================
 *
 * Responsibilities
 * ----------------
 * ✓ Load recipes
 * ✓ Search recipes
 * ✓ Match components
 * ✓ Recommend recipes
 * ✓ Generate blueprint
 *
 */

export default class RecipeEngine {

    constructor(recipes = [], components = []) {

        this.recipes = recipes;
        this.components = components;

        this.recipeIndex = {};
        this.componentIndex = {};

        recipes.forEach(recipe => {

            this.recipeIndex[recipe.id] = recipe;

        });

        components.forEach(component => {

            this.componentIndex[component.id] = component;

        });

    }

    addRecipes(newRecipes) {
        newRecipes.forEach(recipe => {
            if (!this.recipeIndex[recipe.id]) {
                this.recipes.push(recipe);
                this.recipeIndex[recipe.id] = recipe;
            }
        });
    }

    addComponents(newComponents) {
        newComponents.forEach(component => {
            if (!this.componentIndex[component.id]) {
                this.components.push(component);
                this.componentIndex[component.id] = component;
            }
        });
    }

    /**
     * ----------------------------------------
     * Get Recipe
     * ----------------------------------------
     */

    getRecipe(id) {

        return this.recipeIndex[id] || null;

    }

    /**
     * ----------------------------------------
     * List Recipes
     * ----------------------------------------
     */

    getAllRecipes() {

        return this.recipes;

    }

    /**
     * ----------------------------------------
     * Recipes By Domain
     * ----------------------------------------
     */

    getRecipesByDomain(domain) {

        return this.recipes.filter(recipe =>
            recipe.domain === domain
        );

    }

    /**
     * ----------------------------------------
     * Component Details
     * ----------------------------------------
     */

    getRecipeComponents(recipe) {

        return recipe.components.map(id => {

            return this.componentIndex[id];

        }).filter(Boolean);

    }

    /**
     * ----------------------------------------
     * Recipe Match Score
     * ----------------------------------------
     */

    calculateMatch(recipe, selectedComponents = []) {

        if (!recipe.components || recipe.components.length === 0) {

            return 0;

        }

        let matches = 0;

        recipe.components.forEach(component => {

            if (selectedComponents.includes(component)) {

                matches++;

            }

        });

        return Math.round(

            (matches / recipe.components.length) * 100

        );

    }

    /**
     * ----------------------------------------
     * Recommend Recipes
     * ----------------------------------------
     */

    recommend(selectedComponents = []) {

        return this.recipes

            .map(recipe => ({

                recipe,

                score: this.calculateMatch(

                    recipe,

                    selectedComponents

                )

            }))

            .sort((a, b) => b.score - a.score);

    }

    /**
     * ----------------------------------------
     * Generate Blueprint
     * ----------------------------------------
     */

    generateBlueprint(recipeId) {

        const recipe = this.getRecipe(recipeId);

        if (!recipe) {

            return null;

        }

        const components =
            this.getRecipeComponents(recipe);

        return {

            id: recipe.id,

            title: recipe.title,

            description: recipe.description,

            domain: recipe.domain,

            difficulty: recipe.difficulty,

            estimatedHours:
                recipe.estimatedHours,

            projectTypes:
                recipe.projectTypes,

            components,

            recommended:
                recipe.recommended,

            learningGoals:
                recipe.learningGoals,

            outputs:
                recipe.expectedOutputs,

            starterCommands:
                recipe.starterCommands,

            warnings:
                recipe.warnings

        };

    }

}