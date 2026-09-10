export type NavigationRouteKind = "page" | "section";

export interface NavigationRoute {
  id: string;
  label: string;
  href: string;
  kind: NavigationRouteKind;
  mobilePrimary?: boolean;
  description: string;
}

/**
 * Single source of truth for destinations exposed by the application shell.
 * Keep every sidebar/header destination here so navigation cannot drift away
 * from the routes and in-page anchors that actually exist.
 */
export const NAVIGATION_ROUTES: readonly NavigationRoute[] = [
  {
    id: "workspace",
    label: "Workspace",
    href: "/",
    kind: "page",
    mobilePrimary: true,
    description: "Project workspace and overview",
  },
  {
    id: "define",
    label: "Project Definition",
    href: "/#define",
    kind: "section",
    mobilePrimary: true,
    description: "Define project requirements and constraints",
  },
  {
    id: "recommendations",
    label: "Recommended Stack",
    href: "/#recommendations",
    kind: "section",
    mobilePrimary: true,
    description: "Review recommended technologies",
  },
  {
    id: "components",
    label: "Component Library",
    href: "/#components",
    kind: "section",
    description: "Browse reusable technology components",
  },
  {
    id: "validation",
    label: "Validation Engine",
    href: "/#validation",
    kind: "section",
    mobilePrimary: true,
    description: "Validate architecture and stack decisions",
  },
  {
    id: "blueprint",
    label: "Architecture Blueprint",
    href: "/#blueprint",
    kind: "section",
    mobilePrimary: true,
    description: "Generate and inspect the architecture blueprint",
  },
  {
    id: "docs",
    label: "Specification Docs",
    href: "/#docs",
    kind: "section",
    description: "Read generated specification documents",
  },
  {
    id: "content-detail",
    label: "Content Detail",
    href: "/content-detail",
    kind: "page",
    description: "View detailed content",
  },
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
