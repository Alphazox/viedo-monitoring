import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="wordmark" style={{ fontSize: 16 }}>
              <span className="dot" />
              AegisVision AI
            </div>
            <p>AI video intelligence, self-hosted. Watch every camera. Track what matters. Ask it anything.</p>
            <a className="foot-mail" href="mailto:hello@aegisvision.ai">
              hello@aegisvision.ai
            </a>
          </div>
          <div className="foot-col">
            <h5>Product</h5>
            <ul>
              <li>
                <Link href="/platform" transitionTypes={["nav-forward"]}>
                  Platform
                </Link>
              </li>
              <li>
                <Link href="/investigate" transitionTypes={["nav-forward"]}>
                  Investigation
                </Link>
              </li>
              <li>
                <Link href="/intelligence" transitionTypes={["nav-forward"]}>
                  Intelligence planes
                </Link>
              </li>
              <li>
                <Link href="/intelligence" transitionTypes={["nav-forward"]}>
                  Agent mesh
                </Link>
              </li>
              <li>
                <Link href="/sectors" transitionTypes={["nav-forward"]}>
                  Sectors
                </Link>
              </li>
              <li>
                <Link href="/pricing" transitionTypes={["nav-forward"]}>
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>Trust</h5>
            <ul>
              <li>
                <Link href="/#trust" transitionTypes={["nav-back"]}>
                  Privacy &amp; redaction
                </Link>
              </li>
              <li>
                <Link href="/#trust" transitionTypes={["nav-back"]}>
                  Evidence integrity
                </Link>
              </li>
              <li>
                <Link href="/#trust" transitionTypes={["nav-back"]}>
                  Policy engine
                </Link>
              </li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>Company</h5>
            <ul>
              <li>
                <Link href="/about" transitionTypes={["nav-forward"]}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/#cta" transitionTypes={["nav-back"]}>
                  Request a retro-analysis
                </Link>
              </li>
              <li>
                <a href="mailto:solutions@aegisvision.ai">Talk to the team</a>
              </li>
              <li>
                <a href="mailto:hello@aegisvision.ai">Contact</a>
              </li>
              <li>
                <Link href="/login" transitionTypes={["nav-forward"]}>
                  Customer log in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom foot-inner">
          <ul className="foot-links">
            <li>
              <Link href="/platform" transitionTypes={["nav-forward"]}>
                Platform
              </Link>
            </li>
            <li>
              <Link href="/investigate" transitionTypes={["nav-forward"]}>
                Investigation
              </Link>
            </li>
            <li>
              <Link href="/sectors" transitionTypes={["nav-forward"]}>
                Sectors
              </Link>
            </li>
            <li>
              <Link href="/pricing" transitionTypes={["nav-forward"]}>
                Pricing
              </Link>
            </li>
          </ul>
          <div className="foot-copy">AEGISVISION AI · EARLY ACCESS</div>
        </div>
      </div>
    </footer>
  );
}
