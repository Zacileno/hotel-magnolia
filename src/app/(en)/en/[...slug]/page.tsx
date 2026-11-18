import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SitePage from "@/components/SitePage";
import { getPage, pageMetadata, staticParams } from "@/lib/content";

type Props = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return staticParams("en");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage("en", slug);
  return page ? pageMetadata(page) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = await getPage("en", slug);
  if (!page) notFound();
  return <SitePage page={page} />;
}
