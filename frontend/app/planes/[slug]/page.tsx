import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { SandboxDetail } from "@/components/marketing/sandbox-detail";
import { PLANES, findPlane } from "@/lib/sandboxData";

export function generateStaticParams() {
  return PLANES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plane = findPlane(slug);
  if (!plane) return {};
  return { title: `${plane.title} — KESTREL`, description: plane.summary };
}

export default async function PlanePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plane = findPlane(slug);
  if (!plane) notFound();

  const siblings = PLANES.filter((p) => p.slug !== slug).map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <SandboxDetail
            item={plane}
            categoryLabel="Intelligence plane"
            backHref="/intelligence"
            siblings={siblings}
            hrefFor={(s) => `/planes/${s}`}
          />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
