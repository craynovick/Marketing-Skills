import { DocumentationPage, documentationSlugs } from "@/components/docs-content";

export function generateStaticParams() {
  return documentationSlugs.filter(page => page !== "connect" && page !== "self-host").map(page => ({ page }));
}

export default async function Doc({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  return <DocumentationPage page={page} />;
}
