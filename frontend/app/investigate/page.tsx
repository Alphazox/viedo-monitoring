import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { Investigate } from "@/components/marketing/investigate";
import { Queries } from "@/components/marketing/queries";
import { Cta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Investigation — KESTREL",
  description: "Ask, search and investigate in plain language across every camera, every site, live or archived.",
};

export default function InvestigatePage() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <Investigate />
          <Queries />
          <Cta />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
