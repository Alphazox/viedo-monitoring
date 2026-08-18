import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { FiveBets } from "@/components/marketing/five-bets";
import { Cta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Platform — KESTREL",
  description: "The five product pillars KESTREL is built on: open, intelligent, searchable, actionable, commercial.",
};

export default function PlatformPage() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <FiveBets />
          <Cta />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
