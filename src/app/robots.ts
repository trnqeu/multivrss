import type { MetadataRoute } from "next";

const BASE_URL = "https://multivrss.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/u/",
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/share-target",
        "/docs",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
