"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | null;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(null);

  useEffect(() => {
    // Read the persisted theme after hydration (not in the lazy initializer) so the
    // client's first render matches the server, avoiding a hydration mismatch on
    // aria-pressed/aria-label. The <html> background/colors are already correct
    // pre-hydration via the inline script in layout.tsx; this only syncs the button state.
    const saved = window.localStorage.getItem("kestrel-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time sync from localStorage on mount
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function toggle() {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effectiveDark = theme ? theme === "dark" : systemDark;
    const next: Theme = effectiveDark ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("kestrel-theme", next);
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-pressed={isLight}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
    >
      <span className="tt-icon tt-sun" aria-hidden="true">
        ☀
      </span>
      <span className="tt-icon tt-moon" aria-hidden="true">
        ☾
      </span>
    </button>
  );
}
