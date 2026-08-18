import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { ScrollProgress } from "./scroll-progress";

export function SiteNav() {
  return (
    <>
      <header className="nav" style={{ viewTransitionName: "site-header" }}>
        <div className="container nav-inner">
          <Link href="/" className="wordmark" transitionTypes={["nav-back"]}>
            <span className="dot" />
            AegisVision AI
          </Link>
          <ul className="nav-links">
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
                Intelligence
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
            <li>
              <Link href="/about" transitionTypes={["nav-forward"]}>
                About
              </Link>
            </li>
          </ul>
          <div className="nav-right">
            <ThemeToggle />
            <Link
              href="/login"
              transitionTypes={["nav-forward"]}
              style={{ fontSize: 14 }}
            >
              Log in
            </Link>
            <Link
              className="btn btn-ghost"
              href="/#cta"
              transitionTypes={["nav-back"]}
              style={{ padding: "9px 16px", fontSize: 13 }}
            >
              Request access
            </Link>
          </div>
        </div>
      </header>
      <ScrollProgress />
    </>
  );
}
