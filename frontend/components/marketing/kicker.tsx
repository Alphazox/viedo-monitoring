export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
      {children}
    </span>
  );
}
