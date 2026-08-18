import { SiteNav } from "@/components/marketing/site-nav";
import { PageTransition } from "@/components/marketing/page-transition";
import { Hero } from "@/components/marketing/hero";
import { StatsBand } from "@/components/marketing/stats-band";
import { Loop } from "@/components/marketing/loop";
import { DetectionScenarios } from "@/components/marketing/detection-scenarios";
import { ProblemCards } from "@/components/marketing/problem-cards";
import { FiveBets } from "@/components/marketing/five-bets";
import { Compare } from "@/components/marketing/compare";
import { Investigate } from "@/components/marketing/investigate";
import { Queries } from "@/components/marketing/queries";
import { IntelligencePlanes } from "@/components/marketing/intelligence-planes";
import { AgentMesh } from "@/components/marketing/agent-mesh";
import { CommandCenter } from "@/components/marketing/command-center";
import { NetworkReach } from "@/components/marketing/network-reach";
import { GlobalMesh } from "@/components/marketing/global-mesh";
import { Sectors } from "@/components/marketing/sectors";
import { Partners } from "@/components/marketing/partners";
import { Gallery } from "@/components/marketing/gallery";
import { Trust } from "@/components/marketing/trust";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { Cta } from "@/components/marketing/cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function Home() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <Hero />
          <StatsBand />
          <Loop />
          <DetectionScenarios />
          <Gallery />
          <ProblemCards />
          <FiveBets />
          <Compare />
          <Investigate />
          <Queries />
          <IntelligencePlanes />
          <AgentMesh />
          <CommandCenter />
          <NetworkReach />
          <GlobalMesh />
          <Sectors />
          <Partners />
          <Trust />
          <Pricing />
          <Faq />
          <Cta />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
