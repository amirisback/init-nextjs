import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";

// Add all your static routes here
const staticRoutes = [
  "", // Homepage
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${seoConfig.siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
