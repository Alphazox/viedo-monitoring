'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { PageSpinner, ErrorNotice, PreviewBanner, EmptyState } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { camerasApi, sitesApi, usersApi } from '@/lib/api/resources';
import type { Camera, CameraStatus } from '@/lib/api/types';
import { StatTile } from './stat-tile';
import { MOCK_DETECTIONS } from './mock-detections';

const STATS_SAMPLE_LIMIT = 100;

export default function DashboardPage() {
  const [cameras, setCameras] = useState<Camera[] | null>(null);
  const [siteCount, setSiteCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [cameraPage, sites, userPage] = await Promise.all([
          camerasApi.list({ limit: STATS_SAMPLE_LIMIT }),
          sitesApi.list(),
          usersApi.list({ limit: 1 }),
        ]);
        if (cancelled) return;
        setCameras(cameraPage.items);
        setSiteCount(sites.length);
        setUserCount(userPage.total);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const countByStatus = (status: CameraStatus) => cameras?.filter((c) => c.status === status).length ?? 0;

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your organization's cameras and sites." />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {cameras === null ? (
        <PageSpinner />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Cameras" value={cameras.length} />
            <StatTile label="Online" value={countByStatus('ONLINE')} tone="green" />
            <StatTile label="Offline" value={countByStatus('OFFLINE')} tone="red" />
            <StatTile label="Sites" value={siteCount ?? '—'} />
          </div>

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live View</h2>
              <Link href="/cameras" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                Manage cameras →
              </Link>
            </div>
            <PreviewBanner>
              Preview layout — actual video playback needs the Streaming Service (Phase 5) and isn&apos;t wired
              up yet. Tiles below show real camera names and real connectivity status only.
            </PreviewBanner>

            {cameras.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No cameras yet" description="Add a camera to see it appear here." />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {cameras.slice(0, 8).map((camera) => (
                  <div
                    key={camera.id}
                    className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg bg-slate-900 text-slate-500"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="px-2 text-center text-xs font-medium text-slate-300">{camera.name}</span>
                    <StatusBadge status={camera.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Detections</h2>
            <PreviewBanner>
              Mock data — the AI Inference (Phase 6), Tracking (Phase 7) and Event Engine (Phase 8) services
              don&apos;t exist yet, so there is no real detection data to show. These are placeholder rows only.
            </PreviewBanner>
            <div className="mt-3 overflow-hidden rounded-lg ring-1 ring-slate-200 dark:ring-slate-800">
              <ul className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {MOCK_DETECTIONS.map((detection) => (
                  <li key={detection.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Badge tone="amber">{detection.label}</Badge>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{detection.cameraName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{Math.round(detection.confidence * 100)}% confidence</span>
                      <span>{detection.minutesAgo}m ago</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <p className="mt-6 text-xs text-slate-400">{userCount ?? '—'} user{userCount === 1 ? '' : 's'} in your organization.</p>
        </>
      )}
    </div>
  );
}
