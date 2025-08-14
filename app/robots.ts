import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cannafriend.app";

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
        "/analyze-plant/",
        "/ai-consumer/",
        "/stash/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
