import SiteDocument from "@/components/SiteDocument";

export default function DeLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="de-DE">{children}</SiteDocument>;
}
