import Link from "next/link";
import { Reveal } from "./reveal";
import { TIERS } from "@/lib/sandboxData";

const PRICE: Record<string, { amount: string; unit: string; amount2?: string; unit2?: string }> = {
  watch: { amount: "$19", unit: "/ camera / mo" },
  verify: { amount: "$39", unit: "/ camera / mo" },
  investigate: { amount: "$12", unit: "/ seat +", amount2: "$9", unit2: "/ camera / mo" },
  respond: { amount: "$79", unit: "/ camera / mo" },
  operate: { amount: "+$25", unit: "/ camera / mo" },
};

export function Pricing() {
  return (
    <section className="sec" id="pricing">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">Early access pricing</div>
          <h2>Priced by what it&apos;s used for</h2>
          <p>Camera-based tiers for detection. Seat-based pricing for investigation. Illustrative for now — final pricing is confirmed when you request access.</p>
        </Reveal>
        <Reveal className="pricing">
          {TIERS.map((tier) => {
            const price = PRICE[tier.slug];
            return (
              <Link
                className={`tier${tier.slug === "investigate" ? " hi" : ""}`}
                href={`/pricing/${tier.slug}`}
                key={tier.slug}
                transitionTypes={["nav-forward"]}
              >
                <div className="tname">{tier.title}</div>
                <div className="tprice">
                  {price.amount} <span>{price.unit}</span>
                </div>
                {price.amount2 && (
                  <div className="tprice" style={{ marginTop: -6 }}>
                    {price.amount2} <span>{price.unit2}</span>
                  </div>
                )}
                <p className="tdesc">{tier.summary}</p>
              </Link>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
