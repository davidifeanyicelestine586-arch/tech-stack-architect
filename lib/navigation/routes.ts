export type NavigationRouteKind = "page" | "section";

export interface NavigationRoute {
  id: string;
  label: string;
  href: string;
  kind: NavigationRouteKind;
  mobilePrimary?: boolean;
  description: string;
}

export const NAVIGATION_ROUTES: readonly NavigationRoute[] = [
  { id: "workspace", label: "Workspace", href: "/app", kind: "page", mobilePrimary: true, description: "Project workspace and overview" },
  { id: "define", label: "Project Definition", href: "/app#define", kind: "section", mobilePrimary: true, description: "Define project requirements and constraints" },
  { id: "recommendations", label: "Recommended Stack", href: "/app#recommendations", kind: "section", mobilePrimary: true, description: "Review recommended technologies" },
  { id: "components", label: "Component Library", href: "/app#components", kind: "section", description: "Browse reusable technology components" },
  { id: "validation", label: "Validation Engine", href: "/app#validation", kind: "section", mobilePrimary: true, description: "Validate architecture and stack decisions" },
  { id: "blueprint", label: "Architecture Blueprint", href: "/app#blueprint", kind: "section", mobilePrimary: true, description: "Generate and inspect the architecture blueprint" },
  { id: "docs", label: "Documentation", href: "/content-detail", kind: "page", description: "Read the component documentation registry" },
  { id: "technologies", label: "Technologies", href: "/technologies", kind: "page", description: "Browse the technology catalog" },
  { id: "domains", label: "Domains", href: "/domains", kind: "page", description: "Browse project domains" },
  { id: "stacks", label: "Stacks", href: "/stacks", kind: "page", description: "Browse reusable stack recipes" },
] as const;

export const NAVIGATION_ROUTE_BY_ID = Object.fromEntries(
  NAVIGATION_ROUTES.map((route) => [route.id, route])
) as Record<string, NavigationRoute>;

export const MOBILE_PRIMARY_NAVIGATION = NAVIGATION_ROUTES.filter(
  (route) => route.mobilePrimary
);

export function isRegisteredNavigationHref(href: string): boolean {
  return NAVIGATION_ROUTES.some((route) => route.href === href);
}
