import { SITE_NAME, absoluteUrl } from "@/lib/seo/site";

export const CONTENT_LAST_MODIFIED = "2026-10-04";

export function contentDescription(description: string): string {
  const base = description.trim();
  if (base.length >= 140 && base.length <= 160) return base;
  const suffixes = [
    " Explore this registry entry.",
    " Explore its registered context and related links.",
    " Explore its registered details and related stack context.",
    " Explore its registered metadata and related stack recipes in the registry.",
    " Explore its registered metadata, dependencies, outputs, constraints, and related stack context.",
    " Explore its registered metadata, dependencies, constraints, outputs, and related stack recipes in the registry.",
    " Explore its registered metadata, dependencies, constraints, outputs, learning context, and related stack recipes in the registry.",
  ];
  for (const suffix of suffixes) {
    const candidate = base + suffix;
    if (candidate.length >= 140 && candidate.length <= 160) return candidate;
  }
  if (base.length > 160) {
    const truncated = base.slice(0, 157).replace(/[,;:\s]+\S*$/, "").trim();
    return `${truncated}...`;
  }
  return base.slice(0, 160);
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; item: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.headline,
    description: input.description,
    url: input.url,
    dateModified: CONTENT_LAST_MODIFIED,
    publisher: {
      "@type": "Organization",
      name: "Ediccrew",
    },
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: input.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}
