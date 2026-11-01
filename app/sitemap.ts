import type { MetadataRoute } from "next";

import { LOCALES, localePath } from "@/lib/i18n";
import { siteBaseUrl } from "@/lib/i18n/seo";

const PUBLIC_PATHS: ReadonlyArray<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/login", priority: 0.4 },
  { path: "/register", priority: 0.6 },
];

/**
 * Pages publiques en français et en anglais, avec leurs alternates hreflang. Dashboard et API exclus.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl();
  const lastModified = new Date();

  return LOCALES.flatMap((locale) =>
    PUBLIC_PATHS.map(({ path, priority }) => ({
      url: `${base}${localePath(locale, path)}`,
      lastModified,
      changeFrequency: path === "/" ? ("daily" as const) : ("monthly" as const),
      priority,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((alt) => [alt, `${base}${localePath(alt, path)}`])),
      },
    }))
  );
}
