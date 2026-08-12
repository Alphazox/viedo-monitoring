import { Kicker } from './kicker';

export function PageHero({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.indigo.500/0.14),transparent)]"
      />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </section>
  );
}
