import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/_next/static/"],
        disallow: ["/api/", "/_next/data/", "/scripts/"],
      },
    ],
    sitemap: "https://hubbly.io/sitemap.xml",
    host: "https://hubbly.io",
  };
}
