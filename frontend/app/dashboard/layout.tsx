"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="dash-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dash-shell">
      <Sidebar />
      <div className="dash-main">
        <Topbar />
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
