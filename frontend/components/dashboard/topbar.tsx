"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SECURITY_OPERATOR: "Security Operator",
  VIEWER: "Viewer",
};

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="dash-topbar">
      <div className="dash-topbar-org">{user?.organization_name}</div>
      <div className="dash-topbar-right">
        {user && (
          <div className="dash-user">
            <span className="dash-user-name">{user.full_name}</span>
            <span className="badge">{ROLE_LABELS[user.role] ?? user.role}</span>
          </div>
        )}
        <button className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
