import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://cannafriend.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/dashboard/",
        "/plants/",
        "/settings/",
        "/journal/",
        "/reminders/",
        "/ai-assistant/",
        "/stash/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
