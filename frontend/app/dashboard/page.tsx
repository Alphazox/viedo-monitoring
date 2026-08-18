"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { camerasApi } from "@/lib/api/resources";
import type { Camera } from "@/lib/api/types";
import { aiEngineClient, type Alert } from "@/lib/api/aiEngineClient";
import { StatTile } from "@/components/dashboard/stat-tile";
import { EventTrendsChart, type TrendPoint } from "@/components/dashboard/event-trends-chart";

const RANGES = [
  { key: "24h", label: "24 hrs", hours: 24 },
  { key: "7d", label: "7 days", hours: 24 * 7 },
  { key: "30d", label: "30 days", hours: 24 * 30 },
] as const;

const ALERT_LABELS: Record<Alert["type"], string> = {
  person_detected: "Person detected",
  loitering: "Loitering / suspicious activity",
  watchlist_match: "Watchlist match",
  intrusion: "Zone intrusion",
  fall_detected: "Fall detected",
};

const SEVERITY_DOT: Record<Alert["severity"], string> = {
  info: "var(--blue)",
  warning: "var(--amber)",
  critical: "var(--crimson)",
};

function bucketAlerts(alerts: Alert[], hours: number): TrendPoint[] {
  const buckets = Math.min(hours, 24);
  const bucketSizeMs = (hours * 3600_000) / buckets;
  const now = Date.now();
  const points: TrendPoint[] = [];

  for (let i = buckets - 1; i >= 0; i--) {
    const bucketEnd = now - i * bucketSizeMs;
    const bucketStart = bucketEnd - bucketSizeMs;
    const prevStart = bucketStart - hours * 3600_000;
    const prevEnd = bucketEnd - hours * 3600_000;

    const current = alerts.filter((a) => {
      const t = new Date(a.created_at).getTime();
      return t >= bucketStart && t < bucketEnd;
    }).length;
    const previous = alerts.filter((a) => {
      const t = new Date(a.created_at).getTime();
      return t >= prevStart && t < prevEnd;
    }).length;

    const d = new Date(bucketEnd);
    const label = hours <= 24 ? `${d.getHours()}:00` : `${d.getMonth() + 1}/${d.getDate()}`;
    points.push({ label, current, previous });
  }
  return points;
}

export default function DashboardPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiEngineOffline, setAiEngineOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("24h");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [camerasResult, alertsResult] = await Promise.allSettled([camerasApi.list(), aiEngineClient.alerts()]);
      if (cancelled) return;
      if (camerasResult.status === "fulfilled") setCameras(camerasResult.value.items);
      if (alertsResult.status === "fulfilled") {
        setAlerts(alertsResult.value.items);
        setAiEngineOffline(false);
      } else {
        setAiEngineOffline(true);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onlineCount = cameras.filter((c) => c.status === "ONLINE").length;
  const offlineCount = cameras.filter((c) => c.status !== "ONLINE").length;
  const watchlistCount = alerts.filter((a) => a.type === "watchlist_match").length;
  const suspiciousCount = alerts.filter((a) => a.type === "loitering" || a.type === "intrusion").length;
  const fallCount = alerts.filter((a) => a.type === "fall_detected").length;

  const activeRange = RANGES.find((r) => r.key === range)!;
  const trendData = useMemo(() => bucketAlerts(alerts, activeRange.hours), [alerts, activeRange.hours]);
  const recentEvents = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6),
    [alerts]
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Live overview of your sites and cameras.</p>
        </div>
        <div className="range-toggle">
          {RANGES.map((r) => (
            <button key={r.key} className={r.key === range ? "active" : ""} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {aiEngineOffline && (
        <div className="dash-empty" style={{ textAlign: "left", marginBottom: 20, borderRadius: 6, border: "1px solid var(--line)", padding: "14px 18px" }}>
          The AI engine isn&apos;t reachable, so detection/gait/activity events aren&apos;t showing yet. Run the{" "}
          <Link href="/dashboard/events">AI Events demo</Link> once it&apos;s running to populate this dashboard.
        </div>
      )}

      <div className="stat-grid">
        <StatTile label="Cameras online" value={loading ? "–" : onlineCount} icon="◉" tone="teal" />
        <StatTile label="Cameras offline" value={loading ? "–" : offlineCount} icon="◎" tone="crimson" />
        <StatTile label="Loitering / intrusion" value={loading ? "–" : suspiciousCount} icon="▲" tone="amber" />
        <StatTile label="Watchlist matches" value={loading ? "–" : watchlistCount} icon="◍" tone="violet" />
        <StatTile label="Falls detected" value={loading ? "–" : fallCount} icon="⚠" tone="crimson" />
      </div>

      <div className="dash-grid-2">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Event trends</h3>
          </div>
          <div className="dash-panel-body">
            <EventTrendsChart data={trendData} />
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Cameras</h3>
            <Link href="/dashboard/cameras" style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
              View all
            </Link>
          </div>
          {cameras.length === 0 ? (
            <div className="dash-empty">{loading ? "Loading…" : "No cameras yet."}</div>
          ) : (
            <div>
              {cameras.slice(0, 6).map((c) => (
                <div className="cam-row" key={c.id}>
                  <div>
                    <div className="name">{c.name}</div>
                    {c.location && <div className="loc">{c.location}</div>}
                  </div>
                  <span className={`badge ${c.status === "ONLINE" ? "tone-green" : "tone-red"}`}>
                    {c.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-panel" style={{ marginTop: 16 }}>
        <div className="dash-panel-head">
          <h3>Recent events</h3>
          <Link href="/dashboard/events" style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
            View all
          </Link>
        </div>
        {recentEvents.length === 0 ? (
          <div className="dash-empty">
            {aiEngineOffline ? (
              "No events yet."
            ) : (
              <>
                No events yet. <Link href="/dashboard/events">Run the AI demo pipeline</Link> to generate some.
              </>
            )}
          </div>
        ) : (
          <div>
            {recentEvents.map((e) => (
              <div className="event-row" key={e.id}>
                <span className="event-dot" style={{ background: SEVERITY_DOT[e.severity] }} />
                <div className="meta">
                  <div className="title">{ALERT_LABELS[e.type] ?? e.type}</div>
                  <div className="sub">
                    {e.message}
                    {e.camera_label ? ` · ${e.camera_label}` : ""} · {new Date(e.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
