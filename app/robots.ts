import type { MetadataRoute } from "next";

import { siteBaseUrl } from "@/lib/i18n/seo";

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/en/dashboard", "/api/", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
