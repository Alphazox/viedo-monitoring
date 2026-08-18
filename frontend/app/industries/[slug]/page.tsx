import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { IndustryDetail } from "@/components/marketing/industry-detail";
import { SECTORS, findSector } from "@/lib/sandboxData";

export function generateStaticParams() {
  return SECTORS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = findSector(slug);
  if (!sector) return {};
  return {
    title: `${sector.title} — AegisVision AI`,
    description: sector.summary,
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = findSector(slug);
  if (!sector) notFound();

  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <IndustryDetail sector={sector} />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
