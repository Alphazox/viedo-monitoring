"use client";

import { useState } from "react";
import { Reveal } from "./reveal";

const ITEMS = [
  {
    q: "Does this use facial recognition on everyone?",
    a: "No, not by default. People are tracked using visual attributes — clothing colour, build, direction of movement — not a faceprint. Facial recognition, where it exists at all, is a separate, explicitly opted-into feature, never something running in the background by default.",
  },
  {
    q: "What happens if the internet goes down?",
    a: "Detection and tracking run on your own infrastructure, so a site keeps working even if its connection to the wider internet drops. Live monitoring doesn't depend on a round trip to someone else's cloud.",
  },
  {
    q: "Can we keep our own team monitoring instead of hiring yours?",
    a: "Yes — AegisVision AI is software you run and your own team uses. There's no requirement to buy a monitoring or guarding service alongside it.",
  },
  {
    q: "Do we need to replace our existing cameras?",
    a: "No. It connects over standard RTSP, so in most cases you point it at the cameras you already have rather than installing new hardware.",
  },
  {
    q: 'How is a "possible match" prevented from becoming an accusation?',
    a: 'Structurally, not just by policy. The interface shows a confidence score and says "possible match," never a name. Identity is always a conclusion a person draws and records — the system only ever describes what it observed.',
  },
  {
    q: "What's actually built versus still a target?",
    a: "We're upfront about this rather than blur it: features described as shipped are in the running product today. Anything marked target or roadmap is a design goal we're building toward, not something to rely on yet — including the numbers in the stat band near the top of this page.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="sec sec-alt" id="faq">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">Before you ask</div>
          <h2>Questions worth answering up front</h2>
        </Reveal>
        <Reveal className="faq">
          {ITEMS.map((item, i) => (
            <div className={`faq-item${open === i ? " open" : ""}`} key={item.q}>
              <button
                type="button"
                className="faq-q"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-caret">+</span>
              </button>
              <div className="faq-a">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
