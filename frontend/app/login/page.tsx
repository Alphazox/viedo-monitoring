"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, ApiError } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <img src="/media/photos/control-room-person-30576172.jpg" alt="" aria-hidden="true" />
        <div className="auth-visual-scrim" aria-hidden="true" />
        <div className="auth-visual-hud" aria-hidden="true">
          <span className="auth-visual-corner tl" />
          <span className="auth-visual-corner tr" />
          <span className="auth-visual-corner bl" />
          <span className="auth-visual-corner br" />
          <span className="auth-visual-tag mono">AI vision engine · live</span>
        </div>
        <div className="auth-visual-content">
          <h2>Every camera, watching with you.</h2>
          <p>
            Sign in to see what&apos;s happening across your sites right now — and search everything that already
            happened.
          </p>
          <div className="auth-visual-badges">
            <span className="auth-visual-badge">Self-hosted</span>
            <span className="auth-visual-badge">Real-time detection</span>
            <span className="auth-visual-badge">Plain-English search</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <Link href="/" className="wordmark" style={{ fontSize: 18, marginBottom: 28 }}>
            <span className="dot" />
            AegisVision AI
          </Link>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-sub">Access your operations dashboard.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demo.local"
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-foot">
            Not a customer yet?{" "}
            <Link href="/#cta" transitionTypes={["nav-back"]}>
              Request access
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
