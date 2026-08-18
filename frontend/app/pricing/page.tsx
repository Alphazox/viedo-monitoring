import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageTransition } from "@/components/marketing/page-transition";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { PageBanner } from "@/components/marketing/page-banner";
import { Cta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Pricing — KESTREL",
  description: "Five tiers, priced per camera or per seat — from edge-only Watch to the fully staffed Respond mesh.",
};

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main>
          <PageBanner
            type="photo"
            src="/media/photos/control-room-person-30576172.jpg"
            alt="A person reviewing monitors in a dimly lit control room"
            tag="Reference photography"
            caption="Watch and Verify are software-only — your own staff can respond with the same tools KESTREL's analysts use."
            accent="crimson"
          />
          <Pricing />
          <Faq />
          <Cta />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
