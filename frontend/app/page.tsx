import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/site-header';
import { HeroVisual } from '@/components/marketing/hero-visual';
import { Reveal } from '@/components/marketing/reveal';
import {
  ActivityIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  EyeIcon,
  MapPinIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@/components/marketing/icons';
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  FEATURES,
  HERO_HIGHLIGHTS,
  INDUSTRIES,
  WORKFLOW_STEPS,
} from '@/components/marketing/content';

export const metadata: Metadata = {
  title: `${BRAND_NAME} — AI-powered video security`,
  description:
    'Vantage AI turns your existing cameras into a real-time security team: person detection, cross-camera gait re-identification, and instant alerts.',
};

const FEATURE_ICONS = {
  user: UserIcon,
  loop: ArrowPathIcon,
  activity: ActivityIcon,
  map: MapPinIcon,
  play: PlayCircleIcon,
  shield: ShieldCheckIcon,
} as const;

const WORKFLOW_ICONS = {
  eye: EyeIcon,
  loop: ArrowPathIcon,
  bolt: BoltIcon,
  play: PlayCircleIcon,
} as const;

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.indigo.500/0.16),transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,theme(colors.slate.200/0.6)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.200/0.6)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,black,transparent)] dark:bg-[linear-gradient(to_right,theme(colors.slate.800/0.6)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800/0.6)_1px,transparent_1px)]"
          />

          <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                AI video security platform
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
                Turn every camera into an{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                  AI security analyst
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                {BRAND_NAME} watches your cameras around the clock — detecting people, tracking them across
                locations by how they walk, and alerting your team the moment something needs attention.
              </p>

              <ul className="mt-8 space-y-3">
                {HERO_HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CheckIcon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  href="#contact"
                  className="group inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30"
                >
                  Request a demo
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                >
                  See how it works <span aria-hidden>→</span>
                </Link>
              </div>
            </div>

            <div className="lg:pl-6">
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* Platform / features */}
        <section
          id="platform"
          className="border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/30"
        >
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <Kicker>Platform</Kicker>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything a security team needs, in one console
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                From detection to investigation, {BRAND_NAME} covers the full lifecycle of a security event.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => {
                const FeatureIcon = FEATURE_ICONS[feature.icon];
                return (
                  <Reveal key={feature.title} delay={i * 60}>
                    <div className="group h-full rounded-xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-900">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400">
                        <FeatureIcon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-4 font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <Kicker>Process</Kicker>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From footage to action, automatically
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              A four-step pipeline runs on every camera feed, continuously.
            </p>
          </Reveal>

          <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden
              className="absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent lg:block dark:via-slate-800"
            />
            {WORKFLOW_STEPS.map((step, i) => {
              const StepIcon = WORKFLOW_ICONS[step.icon];
              return (
                <Reveal key={step.step} delay={i * 90}>
                  <div className="relative">
                    <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 shadow-sm dark:border-indigo-900 dark:bg-slate-950 dark:text-indigo-400">
                      <StepIcon className="h-6 w-6" />
                    </span>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-600">
                        {step.step}
                      </span>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Industries */}
        <section
          id="industries"
          className="border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/30"
        >
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <Kicker>Industries</Kicker>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for teams managing physical sites
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Wherever people and cameras meet, {BRAND_NAME} helps a small team keep watch over many locations.
              </p>
            </Reveal>

            <Reveal delay={100} className="mt-10 flex flex-wrap gap-3">
              {INDUSTRIES.map((industry) => (
                <span
                  key={industry}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  {industry}
                </span>
              ))}
            </Reveal>
          </div>
        </section>

        {/* CTA / Contact */}
        <section id="contact" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-16 text-center shadow-xl shadow-indigo-600/20 sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(255,255,255,0.15),transparent)]"
            />
            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See {BRAND_NAME} on your own cameras
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-indigo-100">
              Tell us a bit about your site and we&apos;ll set up a walkthrough of the platform.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${BRAND_NAME} demo request`)}`}
                className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Email {CONTACT_EMAIL}
              </a>
              <Link
                href="/login"
                className="rounded-md px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 transition-colors hover:bg-white/10"
              >
                Sign in to console
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs text-white">
              V
            </span>
            {BRAND_NAME}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
