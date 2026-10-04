import componentsData from "@/data/components.json";
import domainsData from "@/data/domain.json";
import recipesData from "@/data/recipes.json";
import type { Component, Domain, Recipe } from "@/lib/types";

const components = componentsData as Component[];
const domains = domainsData as Domain[];
const recipes = recipesData as Recipe[];

export function getAllComponents(): Component[] {
  return components;
}

export function getComponent(id: string): Component | null {
  return components.find((component) => component.id === id) ?? null;
}

export function getAllDomains(): Domain[] {
  return domains;
}

export function getDomain(id: string): Domain | null {
  return domains.find((domain) => domain.id === id) ?? null;
}

export function getAllRecipes(): Recipe[] {
  return recipes;
}

export function getRecipe(id: string): Recipe | null {
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export function getComponentsByDomain(domainId: string): Component[] {
  return components.filter((component) => component.domain === domainId);
}

export function getRecipesByDomain(domainId: string): Recipe[] {
  return recipes.filter((recipe) => recipe.domain === domainId);
}

export function getRecipesUsingComponent(componentId: string): Recipe[] {
  return recipes.filter((recipe) => recipe.components.includes(componentId));
}
