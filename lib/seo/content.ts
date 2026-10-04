import { SITE_NAME, absoluteUrl } from "@/lib/seo/site";

export const CONTENT_LAST_MODIFIED = "2026-10-04";

export function contentDescription(description: string): string {
  const suffix = " Explore this entry in the Ediccrew Tech Stack Architect registry.";
  if (description.length >= 140 && description.length <= 160) return description;
  if (description.length > 160) return `${description.slice(0, 157).replace(/[,;:]?\\s+\\S*$/, "")}...`;
  return `${description}${suffix}`;
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
