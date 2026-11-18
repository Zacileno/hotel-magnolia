import type { NextConfig } from "next";

// Pages of another hotel (Hotel Ferdinand, Mariánské Lázně) that were left in the old
// WordPress install. They are not migrated; their addresses go to the homepage.
const FOREIGN_PAGES = [
  "/5-denni-pobyt-pro-dva/",
  "/lecebny-lazensky-pobyt-pro-dva/",
  "/ozdravny-pobyt-pro-seniory-55-pro-jednu-osobu/",
  "/ozdravny-pobyt-pro-seniory-pro-dva-2804/",
  "/prodlouzeny-vikend-deluxe-pro-pary/",
  "/prodlouzeny-vikend-pro-muze-extra/",
  "/prodlouzeny-vikendovy-pobyt-pro-damy-extra/",
  "/relaxacni-6-denni-pobyt-pro-dva/",
  "/relaxacni-pobyt-pro-dva-na-7-dni/",
  "/rodinna-dovolena-na-7-dni/",
  "/silvestrovske-lenoseni-pro-dva/",
  "/vanocni-balicek-pro-dva/",
  "/velikonocni-balicek-pro-dva/",
  "/velikonocni-pohlazeni-pro-dva-na-5-dnu/",
  "/velikonocni-relaxacni-pobyt-na-4-dny/",
  "/vikendovy-wellness-pobyt-na-3-dny-pro-dva/",
  "/wellness-pobyt-na-3-dny-pro-dva-ve-vsedni-dny-nastup-ne-az-streda/",
  "/wellness-pobyt-na-4-dny-pro-dva-nastup-kdykoli/",
  "/wellness-pobyt-pro-dva-na-4-dny/",
  "/wellness-pobyt-pro-dva-na-6-dni/",
  "/wellness-pobyt-pro-dva-na-8-dni/",
  "/wellness-pobyt-pro-dva-na-tri-dny/",
  "/wellness-pobyt-pro-dva-o-vikendu/",
  "/pokoje/",
  "/album/",
  "/album/2017/",
];

const nextConfig: NextConfig = {
  // the old WordPress site used addresses ending with "/" (e.g. /cenik/) — keep them identical
  trailingSlash: true,
  async redirects() {
    return [
      ...FOREIGN_PAGES.map((source) => ({ source, destination: "/", permanent: true })),
      { source: "/galerie/hotel-ferdinand/", destination: "/fotogalerie/", permanent: true },
      // link used on the EN/DE pages of the old site that never existed there
      { source: "/obchodni-podminky/", destination: "/vop/", permanent: true },
      { source: "/en/", destination: "/en/home/", permanent: true },
      { source: "/de/", destination: "/de/hotel-magnolia/", permanent: true },
    ];
  },
};

export default nextConfig;
