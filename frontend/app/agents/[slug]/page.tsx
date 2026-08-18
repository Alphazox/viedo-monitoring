import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { SandboxDetail } from "@/components/marketing/sandbox-detail";
import { AGENTS, findAgent } from "@/lib/sandboxData";

export function generateStaticParams() {
  return AGENTS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = findAgent(slug);
  if (!agent) return {};
  return { title: `${agent.title} agent — KESTREL`, description: agent.summary };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = findAgent(slug);
  if (!agent) notFound();

  const siblings = AGENTS.filter((a) => a.slug !== slug).map((a) => ({ slug: a.slug, title: a.title }));

  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <SandboxDetail
            item={agent}
            categoryLabel="Agent mesh"
            backHref="/intelligence"
            siblings={siblings}
            hrefFor={(s) => `/agents/${s}`}
          />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
