"use client";

import { useState, type FormEvent } from "react";
import { Reveal } from "./reveal";

export function Cta() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    setSubmitted(true);
  }

  return (
    <section className="cta" id="cta">
      <img className="cta-bg" src="/media/photos/cam-37591155.jpg" alt="" aria-hidden="true" />
      <div className="cta-scrim" aria-hidden="true" />
      <div className="container">
        <Reveal>
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            Early access
          </div>
          <h2>See what AegisVision AI finds in footage you already have.</h2>
          <p>
            Send us a short clip from your own cameras and we&apos;ll show you what it can already detect, describe
            and search — no install, no commitment.
          </p>
          <div className="cta-actions">
            <a className="btn btn-primary" href="#contactForm">
              Request early access
            </a>
            <a className="btn btn-ghost" href="mailto:solutions@aegisvision.ai?subject=Talk%20to%20the%20team">
              Talk to the team
            </a>
          </div>

          {!submitted ? (
            <form className="contact-form" id="contactForm" onSubmit={handleSubmit} noValidate>
              <div className="frow">
                <div>
                  <label htmlFor="cfName">Name</label>
                  <input type="text" id="cfName" name="name" required autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="cfEmail">Work email</label>
                  <input type="email" id="cfEmail" name="email" required autoComplete="email" />
                </div>
              </div>
              <div className="frow">
                <div className="ffull">
                  <label htmlFor="cfCompany">Company</label>
                  <input type="text" id="cfCompany" name="company" required autoComplete="organization" />
                </div>
              </div>
              <div className="frow">
                <div className="ffull">
                  <label htmlFor="cfMessage">What should we look at?</label>
                  <textarea
                    id="cfMessage"
                    name="message"
                    placeholder="e.g. 40 cameras across two warehouses, want to see retroactive fall detection and dock detention reporting."
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary fsubmit">
                Send request
              </button>
            </form>
          ) : (
            <div className="contact-success" role="status" tabIndex={-1} style={{ display: "block" }}>
              <div className="ok">✓</div>
              <h3>Request received</h3>
              <p>Someone from the AegisVision AI team will follow up within one business day.</p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
