export function StatTile({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'green' | 'red' }) {
  const valueClass =
    tone === 'green'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'red'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-900 dark:text-slate-100';

  return (
    <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
