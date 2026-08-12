const TILES = [
  { label: 'Loading dock', tone: 'from-indigo-500/25 to-transparent', badge: null },
  { label: 'Main entrance', tone: 'from-emerald-500/25 to-transparent', badge: 'Person detected' },
  { label: 'Parking lot', tone: 'from-slate-500/25 to-transparent', badge: null },
  { label: 'Warehouse floor', tone: 'from-amber-500/25 to-transparent', badge: null },
];

const SIDEBAR_ITEMS = ['Dashboard', 'Cameras', 'Recordings', 'Alerts'];

export function HeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 via-indigo-400/5 to-transparent blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 truncate text-xs font-medium text-slate-400 dark:text-slate-500">
            app.vantage-ai.example/dashboard
          </span>
        </div>

        <div className="flex">
          <div className="hidden w-28 shrink-0 flex-col gap-1 border-r border-slate-200 p-3 sm:flex dark:border-slate-800">
            {SIDEBAR_ITEMS.map((item, i) => (
              <span
                key={item}
                className={`rounded-md px-2 py-1.5 text-[11px] font-medium ${
                  i === 0
                    ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="relative flex-1 p-3">
            <div className="grid grid-cols-2 gap-2.5">
              {TILES.map((tile) => (
                <div
                  key={tile.label}
                  className={`relative aspect-video overflow-hidden rounded-lg border border-slate-200/80 bg-gradient-to-br bg-slate-100 dark:border-slate-800 dark:bg-slate-800 ${tile.tone}`}
                >
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-medium text-white">
                    {tile.label}
                  </span>
                  {tile.badge && (
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      {tile.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-7 -right-5 hidden w-56 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3h.008v.008H12v-.008ZM10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
              />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Alert raised</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Unrecognized visitor · Main entrance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
