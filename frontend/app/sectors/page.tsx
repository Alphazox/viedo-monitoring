import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { Sectors } from "@/components/marketing/sectors";
import { PageBanner } from "@/components/marketing/page-banner";
import { Cta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Sectors — KESTREL",
  description: "Sector packs built for the site, not just the screen — each preconfigured with detections, zones, escalation policy and a KPI dashboard.",
};

export default function SectorsPage() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <PageBanner
            type="photo"
            src="/media/photos/cam-dome-urban-37591158.jpg"
            alt="Modern dome security camera on an urban building"
            tag="Stock photography"
            caption="Eleven sector packs live today, nineteen on the roadmap — same platform, different detection set per site."
            accent="teal"
          />
          <Sectors />
          <Cta />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
