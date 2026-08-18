"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="dash-sidebar">
      <Link href="/" className="wordmark" style={{ fontSize: 16, padding: "0 20px", marginBottom: 8 }}>
        <span className="dot" />
        KESTREL
      </Link>
      <nav className="dash-nav">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`dash-nav-item${active ? " active" : ""}`}>
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
