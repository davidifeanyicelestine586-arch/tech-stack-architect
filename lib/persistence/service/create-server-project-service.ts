import componentsData from "@/data/components.json";
import domainsData from "@/data/domain.json";
import recipesData from "@/data/recipes.json";
import { ProjectRepository } from "../repository/project-repository.js";
import { createSupabaseServerClient } from "../supabase/server";
import { ProjectPersistenceService } from "./project-persistence-service.js";

export const serverProjectRegistries = {
  domains: domainsData,
  components: componentsData,
  recipes: recipesData,
};

export function createServerProjectPersistenceService() {
  const repository = new ProjectRepository({
    client: createSupabaseServerClient(),
    registries: serverProjectRegistries,
  });

  return new ProjectPersistenceService({ repository });
}
