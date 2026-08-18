import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { SandboxDetail } from "@/components/marketing/sandbox-detail";
import { TIERS, findTier } from "@/lib/sandboxData";

export function generateStaticParams() {
  return TIERS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tier = findTier(slug);
  if (!tier) return {};
  return { title: `${tier.title} pricing — KESTREL`, description: tier.summary };
}

export default async function TierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tier = findTier(slug);
  if (!tier) notFound();

  const siblings = TIERS.filter((t) => t.slug !== slug).map((t) => ({ slug: t.slug, title: t.title }));

  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <SandboxDetail
            item={tier}
            categoryLabel="Pricing tier"
            backHref="/pricing"
            siblings={siblings}
            hrefFor={(s) => `/pricing/${s}`}
          />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
