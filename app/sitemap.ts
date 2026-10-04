import type { MetadataRoute } from "next";
import { getAllComponents, getAllDomains, getAllRecipes } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/seo/site";

const PUBLIC_ROUTES = ["/", "/content-detail", "/technologies", "/domains", "/stacks"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-04T00:00:00.000Z");
  const baseEntries = PUBLIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" as const : "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const technologyEntries = getAllComponents().map((component) => ({
    url: absoluteUrl(`/technologies/${component.id}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const domainEntries = getAllDomains().map((domain) => ({
    url: absoluteUrl(`/domains/${domain.id}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const stackEntries = getAllRecipes().map((recipe) => ({
    url: absoluteUrl(`/stacks/${recipe.id}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...baseEntries, ...technologyEntries, ...domainEntries, ...stackEntries];
}
