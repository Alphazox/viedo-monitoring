export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "◧" },
  { href: "/dashboard/cameras", label: "Cameras", icon: "◉" },
  { href: "/dashboard/events", label: "AI Events", icon: "▲" },
  { href: "/dashboard/users", label: "Users", icon: "◍" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];
