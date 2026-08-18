import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { AboutStory } from "@/components/marketing/about-story";
import { Cta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "About — KESTREL",
  description: "Why we started here, the four principles we build every feature against, and how we hold our own claims to account.",
};

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <AboutStory />
          <Cta />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
