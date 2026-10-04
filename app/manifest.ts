import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Tech Stack Architect",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    theme_color: "#171717",
    background_color: "#ffffff",
  };
}
