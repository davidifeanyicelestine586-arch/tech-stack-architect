export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://architect.ediccrew.com";
export const SITE_NAME = "Ediccrew Tech Stack Architect";
export const SITE_DESCRIPTION = "Design, validate, understand, and generate production-ready technology stacks.";

export function absoluteUrl(path: string): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}
