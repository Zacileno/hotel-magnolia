import SiteDocument from "@/components/SiteDocument";

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="en-US">{children}</SiteDocument>;
}
