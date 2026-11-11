import type { MetadataRoute } from "next";
import { SITE_URL } from "./site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/archive`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/posters`,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/thinking-outer-space`,
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];
}
