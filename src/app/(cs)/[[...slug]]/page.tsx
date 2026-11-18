import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SitePage from "@/components/SitePage";
import { getPage, pageMetadata, staticParams } from "@/lib/content";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return staticParams("cs");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage("cs", slug);
  return page ? pageMetadata(page) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = await getPage("cs", slug);
  if (!page) notFound();
  return <SitePage page={page} />;
}
