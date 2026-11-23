import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the old WordPress site used addresses ending with "/" (e.g. /cenik/) — keep them identical
  trailingSlash: true,
  // Browser caching of the static files (PageSpeed: "use efficient cache lifetimes").
  // By default files in /public get max-age=0, so every visit downloads them again.
  async headers() {
    const cache = (value: string) => [{ key: "Cache-Control", value }];
    return [
      // joined stylesheet – its name contains a content hash, so it never changes (scripts/bundle-css.mjs)
      { source: "/css/:path*", headers: cache("public, max-age=31536000, immutable") },
      // photos and uploaded files – WordPress-style unique names, practically never replaced
      { source: "/wp-content/uploads/:path*", headers: cache("public, max-age=31536000") },
      // theme/plugin files (icons, backgrounds, CSS) – may still be edited in this repo, so a shorter time
      { source: "/wp-content/themes/:path*", headers: cache("public, max-age=2592000, stale-while-revalidate=86400") },
      { source: "/wp-content/plugins/:path*", headers: cache("public, max-age=2592000, stale-while-revalidate=86400") },
      { source: "/wp-includes/:path*", headers: cache("public, max-age=2592000, stale-while-revalidate=86400") },
    ];
  },
  async redirects() {
    return [
      // the old site redirects /album/ to the homepage as well
      { source: "/album/", destination: "/", permanent: true },
      // link used on the EN/DE and package pages of the old site that never existed there
      { source: "/obchodni-podminky/", destination: "/vop/", permanent: true },
      { source: "/en/", destination: "/en/home/", permanent: true },
      { source: "/de/", destination: "/de/hotel-magnolia/", permanent: true },
    ];
  },
};

export default nextConfig;
