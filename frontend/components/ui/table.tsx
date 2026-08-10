export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-slate-800">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">{children}</table>
    </div>
  );
}

export function Thead({ columns }: { columns: string[] }) {
  return (
    <thead className="bg-slate-50 dark:bg-slate-900">
      <tr>
        {columns.map((col) => (
          <th
            key={col}
            scope="col"
            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
      {children}
    </tbody>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 ${className}`}>{children}</td>;
}
