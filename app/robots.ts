import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/books",
          "/products",
          "/blogs",
          "/services",
          "/contact",
          "/books/*",
          "/products/*",
          "/blogs/*",
        ],
        disallow: ["/admin/*", "/api/*", "/_next/*", "/static/*"],
      },
    ],
    sitemap: "https://bbn-academy.com/sitemap.xml",
  };
}
