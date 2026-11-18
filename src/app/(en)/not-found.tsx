import SitePage from "@/components/SitePage";
import { getNotFoundPage } from "@/lib/content";

export default async function NotFound() {
  const page = await getNotFoundPage("en");
  if (!page) return <h1>404</h1>;
  return (
    <>
      <title>{page.title}</title>
      <SitePage page={page} />
    </>
  );
}
