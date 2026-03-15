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
        "/settings/",
        "/reminders/",
        "/ai-assistant/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
