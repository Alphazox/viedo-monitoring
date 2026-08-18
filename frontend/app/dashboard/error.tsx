"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="dash-panel" style={{ padding: 32, textAlign: "center" }}>
      <h2>Something went wrong loading the dashboard.</h2>
      <p style={{ marginTop: 8, opacity: 0.7 }}>{error.message}</p>
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
