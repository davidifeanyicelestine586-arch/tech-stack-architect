import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

const PUBLIC_ROUTES = ["/", "/content-detail"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-04T00:00:00.000Z");

  return PUBLIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
