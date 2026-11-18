import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the old WordPress site used addresses ending with "/" (e.g. /cenik/) — keep them identical
  trailingSlash: true,
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
