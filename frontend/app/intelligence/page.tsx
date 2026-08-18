import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { IntelligencePlanes } from "@/components/marketing/intelligence-planes";
import { AgentMesh } from "@/components/marketing/agent-mesh";
import { CommandCenter } from "@/components/marketing/command-center";
import { Cta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Intelligence — KESTREL",
  description:
    "Three intelligence planes on one feed, a six-agent mesh that turns detections into verified action, and the command center that runs it.",
};

export default function IntelligencePage() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <IntelligencePlanes />
          <AgentMesh />
          <CommandCenter />
          <Cta />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
